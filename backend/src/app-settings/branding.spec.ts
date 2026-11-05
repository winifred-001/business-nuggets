import 'reflect-metadata';
import { ValidationPipe } from '@nestjs/common';
import { UpdateBrandingDto } from './branding.dto';
import { AppSettingsService } from './app-settings.service';
let content: string | undefined;
jest.mock('../prisma/db', () => ({ db: {
  runtime: () => ({
    execute: async (statement: { sql: string; values: string[] }) => { if (statement.sql.includes('INSERT INTO')) content = statement.values[0]; return 1; },
    query: async () => content ? [{ content }] : [],
  }),
  raw: { sql: (strings: TemplateStringsArray, ...values: string[]) => {
    const builder = { affectedCount: () => builder, returnsRow: () => builder, build: () => ({ sql: strings.join('?'), values }) };
    return builder;
  } },
} }));
const pipe = new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true });
const valid = () => ({ logoUrl: 'https://cdn.example.test/logo.png', faviconUrl: '', socialImageUrl: '' });
describe('Settings branding', () => {
  beforeEach(() => { content = undefined; });
  it('returns default branding before the first save', async () => {
    expect(await new AppSettingsService().getBranding()).toEqual({ logoUrl: '', faviconUrl: '', socialImageUrl: '' });
  });
  it('persists and reloads assets', async () => {
    expect(await new AppSettingsService().updateBranding(valid())).toEqual(valid());
    expect(await new AppSettingsService().getBranding()).toEqual(valid());
  });
  it('supports clearing assets', async () => {
    const service = new AppSettingsService(); await service.updateBranding(valid());
    expect(await service.updateBranding({ logoUrl: '', faviconUrl: '', socialImageUrl: '' })).toEqual({ logoUrl: '', faviconUrl: '', socialImageUrl: '' });
  });
  it.each(['http://example.test/a.png', 'javascript:alert(1)', 'https://user:password@example.test/a.png'])('rejects unsafe URLs: %s', async logoUrl => {
    await expect(new AppSettingsService().updateBranding({ ...valid(), logoUrl })).rejects.toThrow();
  });
  it('validates missing fields, oversized URLs and unknown settings', async () => {
    const validate = (value: unknown) => pipe.transform(value, { type: 'body', metatype: UpdateBrandingDto });
    await expect(validate({ logoUrl: '' })).rejects.toThrow();
    await expect(validate({ ...valid(), logoUrl: 'https://example.test/' + 'x'.repeat(2048) })).rejects.toThrow();
    await expect(validate({ ...valid(), secret: 'not allowed' })).rejects.toThrow();
    await expect(validate(valid())).resolves.toMatchObject(valid());
  });
  it('returns configuration status without exposing credentials', () => {
    const previous = process.env.PAYSTACK_SECRET_KEY;
    try {
      process.env.PAYSTACK_SECRET_KEY = 'sk_test_private-test-value';
      const data = new AppSettingsService().getConnections();
      expect(data.paystack).toEqual({ configured: true, mode: 'test' });
      expect(JSON.stringify(data)).not.toContain('private-test-value');
      expect(JSON.stringify(data)).not.toContain('connected');
    } finally { if (previous === undefined) delete process.env.PAYSTACK_SECRET_KEY; else process.env.PAYSTACK_SECRET_KEY = previous; }
  });
});
