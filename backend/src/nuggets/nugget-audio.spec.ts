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

describe('Nugget Details content', () => {
  it('validates Details as optional text', async () => {
    await expect(pipe.transform({ ...createInput(), details: 'First\nSecond<br>Third' }, { type: 'body', metatype: CreateNuggetDto })).resolves.toHaveProperty('details', 'First\nSecond<br>Third');
    await expect(pipe.transform({ details: 42 }, { type: 'body', metatype: UpdateNuggetDto })).rejects.toThrow();
  });
  it('saves, reloads, preserves and clears Details independently of Key Principle', async () => {
    const service = new NuggetsService();
    expect(await service.createNugget(createInput())).toHaveProperty('details', null);
    expect(await service.createNugget({ ...createInput(), details: 'First\nSecond<br>Third' })).toMatchObject({ details: 'First\nSecond<br>Third', keyPrinciple: 'Principle' });
    expect(await service.updateNugget('nugget-1', { title: 'Updated' })).toHaveProperty('details', 'First\nSecond<br>Third');
    expect(await service.updateNugget('nugget-1', { details: 'New details' })).toMatchObject({ details: 'New details', keyPrinciple: 'Principle' });
    expect(await service.updateNugget('nugget-1', { details: '' })).toHaveProperty('details', '');
  });
  it('does not reveal Details in locked premium previews', () => {
    const service = new NuggetsService() as unknown as { toLockedPreview: (data: unknown) => Record<string, unknown> };
    expect(service.toLockedPreview({ ...createInput(), details: 'Private teaching' })).toHaveProperty('details', '');
  });
});
