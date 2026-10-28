import 'reflect-metadata';
import { ScheduleService } from './schedule.service';
type Row = Record<string, unknown>;
let nuggets: Row[] = [];
let schedules: Row[] = [];
jest.mock('../prisma/db', () => {
  const table = (kind: 'nuggets' | 'schedules') => {
    const rows = () => kind === 'nuggets' ? nuggets : schedules;
    return {
      all: async () => rows(),
      create: async (data: Row) => { const row = { ...data, id: schedules.length + 1 }; schedules.push(row); return row; },
      where: (query: Row) => ({
        first: async () => rows().find(row => Object.entries(query).every(([key, value]) => row[key] === value)) || null,
        all: async () => rows().filter(row => Object.entries(query).every(([key, value]) => row[key] === value)),
        update: async (data: Row) => { const row = rows().find(row => row.id === query.id); if (row) Object.assign(row, data); return row; },
        delete: async () => { schedules = schedules.filter(row => row.id !== query.id); },
      }),
    };
  };
  return { db: { orm: { public: { Nugget: table('nuggets'), NuggetSchedule: table('schedules') } } } };
});
beforeEach(() => {
  nuggets = Array.from({ length: 15 }, (_, i) => ({ id: `n-${i}`, isGold: false, status: 'published' }));
  schedules = [];
});
describe('Scheduled publishing without a free cap', () => {
  it('allows scheduling and rescheduling a free Nugget when more than ten are published', async () => {
    nuggets.push({ id: 'next', isGold: false, status: 'draft' });
    const service = new ScheduleService();
    await expect(service.createSchedule({ nuggetId: 'next', scheduledFor: '2030-01-01T12:00:00.000Z' })).resolves.toMatchObject({ nuggetId: 'next' });
    await expect(service.updateSchedule(1, { nuggetId: 'next', scheduledFor: '2030-01-02T12:00:00.000Z' })).resolves.toMatchObject({ scheduledFor: '2030-01-02T12:00:00.000Z' });
  });
  it('publishes every due free Nugget beyond ten and preserves its access setting', async () => {
    for (let i = 15; i < 20; i++) {
      nuggets.push({ id: `n-${i}`, isGold: false, status: 'draft' });
      schedules.push({ id: i, nuggetId: `n-${i}`, scheduledFor: '2020-01-01T12:00:00.000Z' });
    }
    await new ScheduleService().processDueSchedules();
    expect(nuggets.every(row => row.status === 'published' && row.isGold === false)).toBe(true);
    expect(schedules).toEqual([]);
  });
});
