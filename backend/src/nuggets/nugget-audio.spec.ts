import 'reflect-metadata';
import { ValidationPipe } from '@nestjs/common';
import { NuggetsService } from './nuggets.service';
import { CreateNuggetDto } from './dto/create-nugget.dto';
import { UpdateNuggetDto } from './dto/update-nugget.dto';
jest.mock('../prisma/db', () => {
  let record: Record<string, unknown> | null = null;
  return { db: { orm: { public: { Nugget: {
    create: jest.fn(async (data: Record<string, unknown>) => { record = data; return record; }),
    where: () => ({ first: async () => record, update: async (data: Record<string, unknown>) => { record = { ...record, ...data }; return record; } }),
  } } } } };
});
const createInput = (): CreateNuggetDto => ({ number: 1, slug: 'test', title: 'Test', topic: 'Work', tag: 'Work', scriptureRef: 'Genesis 1:1', scriptureText: 'Text', image: '/test.png', keyPrinciple: 'Principle', marketplaceApplication: 'Apply', practicalActionPlan: [], duration: '05:00', book: 'Genesis', bibleSection: 'The Pentateuch', challenges: [], status: 'draft' });
const pipe = new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true });
describe('Separate song and Nugget audio', () => {
  it('accepts both audio fields on create and update', async () => {
    await expect(pipe.transform({ ...createInput(), audioUrl: 'https://example.test/song.mp3', nuggetAudioUrl: 'https://example.test/nugget.mp3' }, { type: 'body', metatype: CreateNuggetDto })).resolves.toHaveProperty('nuggetAudioUrl');
    await expect(pipe.transform({ nuggetAudioUrl: '' }, { type: 'body', metatype: UpdateNuggetDto })).resolves.toHaveProperty('nuggetAudioUrl', '');
    await expect(pipe.transform({ nuggetAudioUrl: 42 }, { type: 'body', metatype: UpdateNuggetDto })).rejects.toThrow();
  });
  it('stores both links independently and defaults old Nuggets to no second link', async () => {
    const service = new NuggetsService();
    const legacy = await service.createNugget({ ...createInput(), audioUrl: 'https://example.test/song.mp3' });
    expect(legacy?.audioUrl).toBe('https://example.test/song.mp3'); expect(legacy?.nuggetAudioUrl).toBeNull();
    const created = await service.createNugget({ ...createInput(), audioUrl: ' https://example.test/song.mp3 ', nuggetAudioUrl: ' https://example.test/nugget.mp3 ' });
    expect(created?.audioUrl).toBe('https://example.test/song.mp3'); expect(created?.nuggetAudioUrl).toBe('https://example.test/nugget.mp3');
  });
  it('updates or clears the second URL without changing the song', async () => {
    const service = new NuggetsService();
    await service.createNugget({ ...createInput(), audioUrl: 'https://example.test/song.mp3' });
    const updated = await service.updateNugget('nugget-1', { nuggetAudioUrl: 'https://example.test/nugget.mp3' });
    expect(updated?.audioUrl).toBe('https://example.test/song.mp3'); expect(updated?.nuggetAudioUrl).toBe('https://example.test/nugget.mp3');
    const cleared = await service.updateNugget('nugget-1', { nuggetAudioUrl: '' });
    expect(cleared?.nuggetAudioUrl).toBeNull(); expect(cleared?.audioUrl).toBe('https://example.test/song.mp3');
  });
  it('preserves both links when an older client sends neither field', async () => {
    const service = new NuggetsService();
    await service.createNugget({ ...createInput(), audioUrl: 'song', nuggetAudioUrl: 'nugget' });
    expect(await service.updateNugget('nugget-1', { title: 'Updated' })).toMatchObject({ audioUrl: 'song', nuggetAudioUrl: 'nugget' });
  });
  it('redacts both links from locked previews', () => {
    const service = new NuggetsService() as unknown as { toLockedPreview: (data: unknown) => Record<string, unknown> };
    const preview = service.toLockedPreview({ ...createInput(), audioUrl: 'secret-song', nuggetAudioUrl: 'secret-nugget' });
    expect(preview.audioUrl).toBeNull(); expect(preview.nuggetAudioUrl).toBeNull();
  });
});
