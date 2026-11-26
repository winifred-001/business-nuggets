import 'reflect-metadata';
import { ValidationPipe } from '@nestjs/common';
import { CreateSubscriptionPlanDto, UpdateSubscriptionPlanDto } from './admin-write.dto';

const pipe = new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true });
const payload = {
  name: 'Free Reader', slug: 'free-reader',
  priceCents: 0, currency: 'NGN', billingCycle: 'free',
  features: ['Read Nuggets'], maxNuggets: 5,
};

describe('subscription plan monthly allowance request validation', () => {
  it('accepts a generated slug and monthly Nuggets allowance on create', async () => {
    const data = await pipe.transform(payload, { type: 'body', metatype: CreateSubscriptionPlanDto });
    expect(data).toEqual(payload);
  });

  it('accepts monthly Nuggets allowance on edit without changing the slug', async () => {
    const data = await pipe.transform({ name: 'Premium', maxNuggets: 12 }, {
      type: 'body', metatype: UpdateSubscriptionPlanDto,
    });
    expect(data).toEqual({ name: 'Premium', maxNuggets: 12 });
  });

  it('rejects spaces in manually supplied slugs', async () => {
    await expect(pipe.transform({ ...payload, slug: 'Free Reader' }, {
      type: 'body', metatype: CreateSubscriptionPlanDto,
    })).rejects.toThrow();
  });

  it('rejects invalid allowances and unknown fields', async () => {
    for (const value of [0, -1, 1.5, 10001, '5']) {
      await expect(pipe.transform({ ...payload, maxNuggets: value }, {
        type: 'body', metatype: CreateSubscriptionPlanDto,
      })).rejects.toThrow();
    }
    await expect(pipe.transform({ ...payload, extra: true }, {
      type: 'body', metatype: CreateSubscriptionPlanDto,
    })).rejects.toThrow();
  });

  it('preserves old hours properties for compatibility with existing API clients', async () => {
    const input = { ...payload, accessDurationHours: 24, quotaWindowHours: 24 };
    await expect(pipe.transform(input, { type: 'body', metatype: CreateSubscriptionPlanDto }))
      .resolves.toMatchObject(input);
  });
});
