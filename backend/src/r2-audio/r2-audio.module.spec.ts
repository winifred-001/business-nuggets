
import 'reflect-metadata';
import { Test } from '@nestjs/testing';
import { R2AudioModule } from './r2-audio.module';
import { R2AudioController } from './r2-audio.controller';
import { R2AudioService } from './r2-audio.service';

describe('R2AudioModule dependency wiring', () => {
  it('resolves the audio controller and its dependencies', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [R2AudioModule],
    }).compile();

    expect(
      moduleRef.get(R2AudioController, { strict: false }),
    ).toBeDefined();

    expect(
      moduleRef.get(R2AudioService, { strict: false }),
    ).toBeDefined();

    await moduleRef.close();
  });
});
