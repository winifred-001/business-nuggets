import 'reflect-metadata';
import { ValidationPipe } from '@nestjs/common';
import { UpdateLegalPageDto } from './legal-pages.dto';
import { LegalPagesService } from './legal-pages.service';
jest.mock('../prisma/db', () => ({ db: {} }));
const valid = () => ({ title: 'Privacy Policy', introduction: '', notice: '', sections: [{ id: 'information', title: 'Information', body: 'Account details.' }] });
const pipe = new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true });
const validate = (value: unknown) => pipe.transform(value, { type: 'body', metatype: UpdateLegalPageDto });
describe('Legal pages', () => {
  it('accepts structured plain text', async () => { expect((await validate(valid())).title).toBe('Privacy Policy'); });
  it('rejects blank headings, empty sections and oversized bodies', async () => {
    await expect(validate({ ...valid(), title: '   ' })).rejects.toThrow();
    await expect(validate({ ...valid(), sections: [] })).rejects.toThrow();
    const data = valid(); data.sections[0].body = 'x'.repeat(10001);
    await expect(validate(data)).rejects.toThrow();
  });
  it('rejects unknown properties including nested content', async () => {
    await expect(validate({ ...valid(), role: 'owner' })).rejects.toThrow();
    await expect(validate({ ...valid(), sections: [{ ...valid().sections[0], html: true }] })).rejects.toThrow();
  });
  it('rejects invalid anchors and duplicate IDs before database access', async () => {
    const data = valid(); data.sections[0].id = '<invalid>';
    await expect(validate(data)).rejects.toThrow();
    const duplicate = valid(); duplicate.sections.push({ ...duplicate.sections[0] });
    await expect(new LegalPagesService().updatePage('privacy-policy', duplicate)).rejects.toThrow('unique ID');
  });
  it('restricts slugs to privacy policy and terms', async () => {
    const service = new LegalPagesService();
    await expect(service.getPage('admin')).rejects.toThrow('Legal page not found');
    await expect(service.updatePage('contact', valid())).rejects.toThrow('Legal page not found');
  });
});
