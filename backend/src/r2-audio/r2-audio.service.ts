
import {
  BadGatewayException,
  BadRequestException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import {
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'crypto';
import { detectMediaMime } from '../media/media-types';

export type R2AudioKind = 'song' | 'nuggets';

const MAX_AUDIO_SIZE = 50 * 1024 * 1024;
const R2_REFERENCE = /^r2:\/\/(song|nuggets)\/([0-9a-f-]{36}\.mp3)$/i;

@Injectable()
export class R2AudioService {
  private clientInstance?: S3Client;

  private client(): S3Client {
    const accountId = process.env.R2_ACCOUNT_ID;
    const accessKeyId = process.env.R2_ACCESS_KEY_ID;
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

    if (!accountId || !accessKeyId || !secretAccessKey) {
      throw new ServiceUnavailableException(
        'R2 storage is not configured',
      );
    }

    this.clientInstance ??= new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });

    return this.clientInstance;
  }

  private bucket(kind: R2AudioKind): string {
    const name =
      kind === 'song'
        ? process.env.R2_SONG_BUCKET
        : process.env.R2_NUGGETS_BUCKET;

    if (!name) {
      throw new ServiceUnavailableException(
        `R2 ${kind} bucket is not configured`,
      );
    }

    return name;
  }

  private parseReference(reference: string) {
    const match = R2_REFERENCE.exec(reference);

    if (!match) {
      throw new BadRequestException('Invalid R2 audio reference');
    }

    const kind = match[1].toLowerCase() as R2AudioKind;

    return {
      kind,
      bucket: this.bucket(kind),
      key: match[2].toLowerCase(),
    };
  }

  async signUpload(
    kind: R2AudioKind,
    filename: string,
    size: number,
  ) {
    if (
      (kind !== 'song' && kind !== 'nuggets') ||
      !/\.mp3$/i.test(filename) ||
      !Number.isInteger(size) ||
      size < 1 ||
      size > MAX_AUDIO_SIZE
    ) {
      throw new BadRequestException(
        'Upload an MP3 file no larger than 50 MB',
      );
    }

    const key = `${randomUUID()}.mp3`;

    const uploadUrl = await getSignedUrl(
      this.client(),
      new PutObjectCommand({
        Bucket: this.bucket(kind),
        Key: key,
        ContentType: 'audio/mpeg',
      }),
      { expiresIn: 600 },
    );

    return {
      uploadUrl,
      method: 'PUT',
      contentType: 'audio/mpeg',
      reference: `r2://${kind}/${key}`,
    };
  }

  async completeUpload(reference: string) {
    const { bucket, key } = this.parseReference(reference);

    try {
      const result = await this.client().send(
        new HeadObjectCommand({
          Bucket: bucket,
          Key: key,
        }),
      );

      const size = Number(result.ContentLength ?? 0);
      const contentType = result.ContentType?.split(';')[0].trim();

      if (
        size < 1 ||
        size > MAX_AUDIO_SIZE ||
        contentType !== 'audio/mpeg'
      ) {
        throw new BadRequestException(
          'Uploaded file must be an MP3 no larger than 50 MB',
        );
      }

      const sample = await this.client().send(
        new GetObjectCommand({
          Bucket: bucket,
          Key: key,
          Range: 'bytes=0-8191',
        }),
      );

      const bytes = sample.Body
        ? Buffer.from(await sample.Body.transformToByteArray())
        : Buffer.alloc(0);

      if (detectMediaMime(bytes) !== 'audio/mpeg') {
        throw new BadRequestException(
          'Uploaded file does not contain valid MP3 audio',
        );
      }

      return { reference, size };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new BadGatewayException(
        'Could not verify the uploaded file in R2',
      );
    }
  }

  async resolvePlaybackUrl(reference: string | null | undefined) {
    if (!reference || !reference.startsWith('r2://')) {
      return reference ?? null;
    }

    const { bucket, key } = this.parseReference(reference);

    return getSignedUrl(
      this.client(),
      new GetObjectCommand({
        Bucket: bucket,
        Key: key,
      }),
      { expiresIn: 3600 },
    );
  }
}
