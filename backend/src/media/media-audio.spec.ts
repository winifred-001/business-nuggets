import 'reflect-metadata';
import { ValidationPipe } from '@nestjs/common';
import { createHash } from 'crypto';
import { CloudinaryStorageService } from './cloudinary-storage.service';
import { MediaService } from './media.service';
import { detectMediaMime, mediaLimit, normalizeMime } from './media-types';
import { SaveMediaUrlDto, SignMediaUploadDto } from './dto/media-input.dto';
import { db } from '../prisma/db';

jest.mock('../prisma/db', () => ({
  db: {
    orm: {
      public: {
        MediaAsset: { all: jest.fn(), where: jest.fn(), create: jest.fn() },
        MediaFolder: { where: jest.fn() },
      },
    },
  },
}));
const validSession = {
  publicId: 'business-nuggets/media/test',
  mimeType: 'audio/mpeg',
  originalName: 'teaching.mp3',
  folderId: null,
};
const uploaded = {
  publicId: validSession.publicId,
  secureUrl: 'https://res.cloudinary.com/demo/video/upload/test.mp3',
  bytes: 4000,
  width: null,
  height: null,
};
const cloud = {
  createUploadSignature: jest.fn(),
  verifyUploadToken: jest.fn(),
  inspectUploadedMedia: jest.fn(),
  deleteMedia: jest.fn(),
  getPublicStatus: jest.fn(),
};
const service = () =>
  new MediaService(cloud as unknown as CloudinaryStorageService);
const pipe = new ValidationPipe({
  whitelist: true,
  transform: true,
  forbidNonWhitelisted: true,
});

beforeEach(() => {
  jest.clearAllMocks();
  (db.orm.public.MediaAsset.all as jest.Mock).mockResolvedValue([]);
  (db.orm.public.MediaAsset.where as jest.Mock).mockReturnValue({
    first: async () => null,
    delete: jest.fn(),
  });
  (db.orm.public.MediaAsset.create as jest.Mock).mockImplementation(
    async (data) => ({ id: 1, ...data }),
  );
  (db.orm.public.MediaFolder.where as jest.Mock).mockReturnValue({
    first: async () => ({ id: 1 }),
  });
  cloud.verifyUploadToken.mockReturnValue(validSession);
  cloud.inspectUploadedMedia.mockResolvedValue(uploaded);
  cloud.deleteMedia.mockResolvedValue('ok');
  process.env.CLOUDINARY_CLOUD_NAME = 'demo';
  process.env.CLOUDINARY_API_KEY = 'test-key';
  process.env.CLOUDINARY_API_SECRET = 'test-secret';
});
afterEach(() => jest.restoreAllMocks());

describe('Media audio and links', () => {
  it('detects an MPEG Layer III frame and WAV without trusting extensions', () => {
    const mp3 = Buffer.alloc(417);
    mp3.set([255, 251, 144, 0]);
    expect(detectMediaMime(mp3)).toBe('audio/mpeg');
    const wav = Buffer.alloc(44);
    wav.write('RIFF');
    wav.write('WAVE', 8);
    expect(detectMediaMime(wav)).toBe('audio/wav');
    expect(detectMediaMime(Buffer.from('ID3fake mp3 file'))).toBeNull();
    expect(
      detectMediaMime(Buffer.from('<script>not audio</script>')),
    ).toBeNull();
    expect(normalizeMime('audio/x-wav')).toBe('audio/wav');
  });
  it('preserves image detection and sets separate size limits', () => {
    expect(detectMediaMime(Buffer.from([255, 216, 255]))).toBe('image/jpeg');
    expect(mediaLimit('image/png')).toBe(10 * 1024 * 1024);
    expect(mediaLimit('audio/mpeg')).toBe(50 * 1024 * 1024);
  });
  it('rejects unsafe external URLs, unknown types and invalid sizes', async () => {
    for (const url of [
      'javascript:alert(1)',
      'http://example.com/a.mp3',
      'https://user:pass@example.com/a.mp3',
    ]) {
      await expect(
        pipe.transform(
          { name: 'audio', url, mimeType: 'audio/mpeg' },
          { type: 'body', metatype: SaveMediaUrlDto },
        ),
      ).rejects.toThrow();
    }
    await expect(
      pipe.transform(
        { originalName: 'x', mimeType: 'application/exe', size: 1 },
        { type: 'body', metatype: SignMediaUploadDto },
      ),
    ).rejects.toThrow();
    await expect(
      service().signUpload({
        originalName: 'large.png',
        mimeType: 'image/png',
        size: 11 * 1024 * 1024,
      }),
    ).rejects.toThrow('10 MB');
  });
  it('saves external URLs without fetching or uploading their content', async () => {
    const fetchSpy = jest.spyOn(globalThis, 'fetch');
    const record = await service().saveUrl({
      name: 'R2 teaching',
      url: 'https://example.com/teaching.mp3',
      mimeType: 'audio/mpeg',
    });
    expect(record.filename).toMatch(/^external:/);
    expect(record.size).toBe(0);
    expect(fetchSpy).not.toHaveBeenCalled();
  });
  it('removes a saved external Cloudinary link without deleting the hosted file', async () => {
    (db.orm.public.MediaAsset.where as jest.Mock).mockReturnValue({
      first: async () => ({
        id: 1,
        filename: 'external:link',
        url: uploaded.secureUrl,
        mimeType: 'audio/mpeg',
      }),
      delete: jest.fn(),
    });
    await service().deleteAsset(1);
    expect(cloud.deleteMedia).not.toHaveBeenCalled();
  });
  it('deletes owned audio using the video resource type', async () => {
    (db.orm.public.MediaAsset.where as jest.Mock).mockReturnValue({
      first: async () => ({
        id: 1,
        filename: validSession.publicId,
        url: uploaded.secureUrl,
        mimeType: 'audio/mpeg',
      }),
      delete: jest.fn(),
    });
    await service().deleteAsset(1);
    expect(cloud.deleteMedia).toHaveBeenCalledWith(
      validSession.publicId,
      'video',
    );
  });
  it('finalizes uploads with provider-verified size and null image dimensions', async () => {
    const record = await service().completeUpload('signed-token');
    expect(cloud.inspectUploadedMedia).toHaveBeenCalledWith(
      validSession.publicId,
      'audio/mpeg',
    );
    expect(record).toMatchObject({
      size: 4000,
      mimeType: 'audio/mpeg',
      width: null,
      height: null,
    });
  });
  it('cleans up an upload if the verified size exceeds the limit', async () => {
    cloud.inspectUploadedMedia.mockResolvedValue({
      ...uploaded,
      bytes: 51 * 1024 * 1024,
    });
    await expect(service().completeUpload('signed-token')).rejects.toThrow(
      'size limit',
    );
    expect(cloud.deleteMedia).toHaveBeenCalledWith(
      validSession.publicId,
      'video',
    );
  });
  it('cleans up uploaded bytes when database creation fails', async () => {
    (db.orm.public.MediaAsset.create as jest.Mock).mockRejectedValue(
      new Error('Database unavailable'),
    );
    await expect(service().completeUpload('signed-token')).rejects.toThrow(
      'Database unavailable',
    );
    expect(cloud.deleteMedia).toHaveBeenCalledWith(
      validSession.publicId,
      'video',
    );
  });
  it('signs constrained direct audio uploads without exposing the API secret', () => {
    const storage = new CloudinaryStorageService();
    const signed = storage.createUploadSignature(validSession);
    expect(signed.uploadUrl).toBe(
      'https://api.cloudinary.com/v1_1/demo/video/upload',
    );
    expect(signed.fields.allowed_formats).toBe('mp3');
    expect(signed.fields.overwrite).toBe('false');
    const expected = createHash('sha256')
      .update(
        `allowed_formats=mp3&overwrite=false&public_id=${validSession.publicId}&timestamp=${signed.fields.timestamp}test-secret`,
      )
      .digest('hex');
    expect(signed.fields.signature).toBe(expected);
    expect(JSON.stringify(signed)).not.toContain('test-secret');
    expect(storage.verifyUploadToken(signed.token)).toMatchObject(validSession);
    expect(() => storage.verifyUploadToken(signed.token + 'tampered')).toThrow(
      'Invalid upload session',
    );
  });
  it('rejects expired signed upload sessions', () => {
    const storage = new CloudinaryStorageService();
    const time = jest.spyOn(Date, 'now').mockReturnValue(1000000);
    const signed = storage.createUploadSignature(validSession);
    time.mockReturnValue(5000000);
    expect(() => storage.verifyUploadToken(signed.token)).toThrow('expired');
  });
});
