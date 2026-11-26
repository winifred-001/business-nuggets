import { ForbiddenException } from "@nestjs/common";
import { TopUpsService } from "./topups.service";

type Lot = { reference: string; bundleSlug: string; totalCredits: number; remainingCredits: number; purchasedAt: string; originalExpiresAt: string; invalidatedAt?: string | null };
const mock = {
  lots: [] as Lot[],
  redeemed: new Set<string>(),
  user: {
    id: 7, accountStatus: "active", membershipTier: "premium",
    subscriptionPlan: "premium-monthly", subscriptionStatus: "active",
    subscriptionExpiresAt: "2099-12-31T00:00:00.000Z",
  },
  payment: {
    userId: 7, status: "paid", planSlug: "topup:mini",
    amountCents: 900, currency: "USD", providerReference: "reference-one",
    paidAt: "2026-11-24T09:00:00.000Z", createdAt: "2026-11-24T08:00:00.000Z",
  },
  grantStatement: "",
};

jest.mock("../prisma/db", () => {
  type Plan = { statement: string; args: unknown[] };
  function sql(strings: TemplateStringsArray, ...args: unknown[]) {
    const statement = strings.join("?");
    return {
      affectedCount: () => ({ build: (): Plan => ({ statement, args }) }),
      returnsRow: () => ({ build: (): Plan => ({ statement, args }) }),
    };
  }
  function query(plan: Plan) {
    if (plan.statement.includes('FROM "NuggetTopUpCreditLot" WHERE "userId"')) return Promise.resolve(mock.lots);
    if (plan.statement.includes('FROM "NuggetTopUpRedemption" WHERE "userId"'))
      return Promise.resolve([...mock.redeemed].map(nuggetId => ({ nuggetId })));
    return Promise.resolve([]);
  }
  async function execute(plan: Plan) {
    if (plan.statement.includes('INSERT INTO "NuggetTopUpCreditLot"')) {
      mock.grantStatement = plan.statement;
      const purchasedAt = String(plan.args[0]);
      const reference = String(plan.args[2]);
      if (mock.lots.some(row => row.reference === reference)) return { affectedRows: 0 };
      const purchaseDate = new Date(purchasedAt);
      const expiresAt = new Date(purchaseDate);
      expiresAt.setUTCMonth(expiresAt.getUTCMonth() + 3);
      mock.lots.push({
        reference, bundleSlug: "mini", totalCredits: 2, remainingCredits: 2,
        purchasedAt: purchaseDate.toISOString(), originalExpiresAt: expiresAt.toISOString(), invalidatedAt: null,
      });
      return { affectedRows: 1 };
    }
    if (plan.statement.includes('INSERT INTO "NuggetTopUpRedemption"')) {
      const id = String(plan.args[1]);
      if (mock.redeemed.has(id)) return { affectedRows: 0 };
      mock.redeemed.add(id);
      return { affectedRows: 1 };
    }
    if (plan.statement.includes('UPDATE "NuggetTopUpCreditLot"') && plan.statement.includes('SET "invalidatedAt"')) {
      const paidAt = Date.parse(String(plan.args[0]));
      const affected = mock.lots.filter(lot => !lot.invalidatedAt && lot.remainingCredits > 0 &&
        Date.parse(lot.purchasedAt) < paidAt && Date.parse(lot.originalExpiresAt) > paidAt);
      for (const lot of affected) lot.invalidatedAt = new Date(paidAt).toISOString();
      return { affectedRows: affected.length };
    }
    if (plan.statement.includes('UPDATE "NuggetTopUpCreditLot"')) {
      const lot = mock.lots.filter(x => !x.invalidatedAt && x.remainingCredits > 0 && Date.parse(x.originalExpiresAt) > Date.now())
        .sort((a, b) => Date.parse(a.originalExpiresAt) - Date.parse(b.originalExpiresAt))[0];
      if (!lot) return { affectedRows: 0 };
      lot.remainingCredits--;
      return { affectedRows: 1 };
    }
    return { affectedRows: 1 };
  }
  const db = {
    raw: { sql },
    runtime: () => ({ query, execute }),
    transaction: async (callback: (tx: { execute: typeof execute }) => Promise<unknown>) => {
      const snapshot = { lots: structuredClone(mock.lots), redeemed: new Set(mock.redeemed) };
      try { return await callback({ execute }); }
      catch (error) { mock.lots = snapshot.lots; mock.redeemed = snapshot.redeemed; throw error; }
    },
    orm: { public: {
      User: { where: () => ({ first: async () => mock.user }) },
      BillingTransaction: { where: () => ({ first: async () => mock.payment }) },
    } },
  };
  return { db };
});

describe("verified Top-up credit ledger", () => {
  let topups: TopUpsService;
  beforeEach(() => {
    mock.lots = [];
    mock.redeemed = new Set();
    mock.user.accountStatus = "active";
    mock.user.subscriptionStatus = "active";
    mock.user.subscriptionExpiresAt = "2099-12-31T00:00:00.000Z";
    mock.payment.status = "paid";
    topups = new TopUpsService();
  });

  it("credits a verified reference once, even when the callback is replayed", async () => {
    const first = await topups.grantVerifiedCredits("reference-one", 7);
    const replay = await topups.grantVerifiedCredits("reference-one", 7);
    expect(first.credited).toBe(true);
    expect(replay.credited).toBe(false);
    expect(mock.lots).toHaveLength(1);
    expect(replay.wallet.balance).toBe(2);
    expect(replay.wallet.expired).toBe(0);
    expect(mock.lots[0].purchasedAt).toBe(mock.payment.paidAt);
    expect(mock.grantStatement).toContain("INTERVAL '3 months'");
  });

  it("never credits an unverified or other-account transaction", async () => {
    mock.payment.status = "pending";
    await expect(topups.grantVerifiedCredits("reference-one", 7)).rejects.toThrow();
    mock.payment.status = "paid";
    await expect(topups.grantVerifiedCredits("reference-one", 8)).rejects.toThrow();
    expect(mock.lots).toHaveLength(0);
  });

  it("consumes one credit per new Nugget, not per repeated opening", async () => {
    await topups.grantVerifiedCredits("reference-one", 7);
    expect(await topups.redeem(7, "nugget-1", "2099-12-31T00:00:00Z")).toBe(true);
    expect(await topups.redeem(7, "nugget-1", "2099-12-31T00:00:00Z")).toBe(false);
    expect((await topups.getWallet(7)).balance).toBe(1);
    expect(await topups.redeem(7, "nugget-2", "2099-12-31T00:00:00Z")).toBe(true);
    await expect(topups.redeem(7, "nugget-3", "2099-12-31T00:00:00Z")).rejects.toThrow();
    expect(mock.redeemed.has("nugget-3")).toBe(false);
    expect((await topups.getWallet(7)).balance).toBe(0);
  });

  it("refuses to redeem expired credits even when the subscription is active", async () => {
    mock.lots = [{
      reference: "expired", bundleSlug: "mini", totalCredits: 2, remainingCredits: 2,
      purchasedAt: "2026-07-01T00:00:00Z", originalExpiresAt: "2026-10-01T00:00:00Z",
    }];
    await expect(topups.redeem(7, "nugget-expired", "2099-12-31T00:00:00Z")).rejects.toThrow();
    expect(mock.lots[0].remainingCredits).toBe(2);
    expect(mock.redeemed.has("nugget-expired")).toBe(false);
  });

  it("forfeits only unused, unexpired credits purchased before a verified renewal and leaves Nugget history intact", async () => {
    mock.lots = [
      { reference: "naturally-expired", bundleSlug: "mini", totalCredits: 2, remainingCredits: 2, purchasedAt: "2026-07-01T00:00:00Z", originalExpiresAt: "2026-10-01T00:00:00Z", invalidatedAt: null },
      { reference: "before-renewal", bundleSlug: "mini", totalCredits: 3, remainingCredits: 3, purchasedAt: "2026-10-01T00:00:00Z", originalExpiresAt: "2027-01-01T00:00:00Z", invalidatedAt: null },
      { reference: "after-renewal", bundleSlug: "mini", totalCredits: 4, remainingCredits: 4, purchasedAt: "2026-11-20T00:00:00Z", originalExpiresAt: "2027-02-20T00:00:00Z", invalidatedAt: null },
    ];
    const cleared = await topups.invalidateUnusedCreditsOnSubscriptionChange(7, "2026-11-15T00:00:00Z");
    expect(cleared).toBe(1);
    expect(mock.lots[0].invalidatedAt).toBeNull();
    expect(mock.lots[1].invalidatedAt).toBe("2026-11-15T00:00:00.000Z");
    expect(mock.lots[2].invalidatedAt).toBeNull();
    const wallet = await topups.getWallet(7);
    expect(wallet.balance).toBe(4);
    expect(wallet.expired).toBe(2);
    expect(wallet.invalidated).toBe(3);
    // Renewal invalidates unused credits only; existing Nugget redemption records are untouched.
    expect(mock.redeemed).toEqual(new Set());
  });

  it("cannot redeem a credit lot forfeited by a subscription renewal or upgrade", async () => {
    mock.lots = [{
      reference: "forfeited", bundleSlug: "mini", totalCredits: 3, remainingCredits: 3,
      purchasedAt: "2026-10-01T00:00:00Z", originalExpiresAt: "2027-01-01T00:00:00Z",
      invalidatedAt: "2026-11-15T00:00:00Z",
    }];
    await expect(topups.redeem(7, "nugget-after-renewal", "2099-12-31T00:00:00Z")).rejects.toThrow();
    expect(mock.lots[0].remainingCredits).toBe(3);
    expect(mock.redeemed.has("nugget-after-renewal")).toBe(false);
    expect((await topups.getWallet(7)).balance).toBe(0);
  });

  it("refuses to spend credits in paid grace or on suspended accounts", async () => {
    await topups.grantVerifiedCredits("reference-one", 7);
    mock.user.subscriptionExpiresAt = "2026-11-22T00:00:00Z";
    await expect(topups.redeem(7, "nugget-1", "2026-11-25T00:00:00Z")).rejects.toBeInstanceOf(ForbiddenException);
    mock.user.subscriptionExpiresAt = "2099-12-31T00:00:00.000Z";
    mock.user.accountStatus = "suspended";
    await expect(topups.redeem(7, "nugget-1", "2099-12-31T00:00:00Z")).rejects.toBeInstanceOf(ForbiddenException);
    expect((await topups.getWallet(7)).balance).toBe(2);
  });
});
