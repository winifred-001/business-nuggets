import { hasActivePaidSubscription, hasPaidReadingAccess, isPaidSubscriptionInGrace, graceGrantExpiry, paidReadingExpiry, restoredPaidHistoryExpiry, type PaidHistoryMember } from "./paid-history-access";

const now = Date.parse("2026-11-23T12:00:00Z");
const member: PaidHistoryMember = {
  accountStatus: "active", membershipTier: "premium",
  subscriptionPlan: "premium-monthly", subscriptionStatus: "active",
  subscriptionExpiresAt: "2026-12-20T00:00:00Z",
};
const priorGrant = { openedAt: "2026-11-10T10:00:00Z" };

describe("paid Nugget history restoration", () => {
  it("allows restored access after a later verified payment while subscription is active", () => {
    expect(restoredPaidHistoryExpiry(member, "2026-11-20T10:00:00Z", priorGrant, now)).toBe("2026-12-23T00:00:00.000Z");
  });
  it("does not restore on the original purchase made before the Nugget was opened", () => {
    expect(restoredPaidHistoryExpiry(member, "2026-11-01T10:00:00Z", priorGrant, now)).toBeNull();
    expect(restoredPaidHistoryExpiry(member, priorGrant.openedAt, priorGrant, now)).toBeNull();
  });
  it("requires a stored grant and a paid transaction", () => {
    expect(restoredPaidHistoryExpiry(member, "2026-11-20T10:00:00Z", undefined, now)).toBeNull();
    expect(restoredPaidHistoryExpiry(member, null, priorGrant, now)).toBeNull();
  });
  it("revokes restored access for expired, suspended, inactive, or free memberships", () => {
    expect(restoredPaidHistoryExpiry({ ...member, subscriptionExpiresAt: "2026-11-01T00:00:00Z" }, "2026-11-20T10:00:00Z", priorGrant, now)).toBeNull();
    expect(restoredPaidHistoryExpiry({ ...member, accountStatus: "suspended" }, "2026-11-20T10:00:00Z", priorGrant, now)).toBeNull();
    expect(restoredPaidHistoryExpiry({ ...member, subscriptionStatus: "cancelled" }, "2026-11-20T10:00:00Z", priorGrant, now)).toBeNull();
    expect(restoredPaidHistoryExpiry({ ...member, membershipTier: "free" }, "2026-11-20T10:00:00Z", priorGrant, now)).toBeNull();
  });
  it("requires an unexpired paid subscription for Premium access", () => {
    expect(hasActivePaidSubscription(member, now)).toBe(true);
    expect(hasActivePaidSubscription({ ...member, subscriptionExpiresAt: "2026-11-01T00:00:00Z" }, now)).toBe(false);
  });
});

describe("three-day paid expiry grace", () => {
  const expiry = Date.parse("2026-12-20T00:00:00Z");
  it("preserves paid reading access for precisely 72 hours after subscription expiry", () => {
    expect(isPaidSubscriptionInGrace(member, expiry - 1)).toBe(false);
    expect(isPaidSubscriptionInGrace(member, expiry)).toBe(true);
    expect(hasActivePaidSubscription(member, expiry)).toBe(false);
    expect(hasPaidReadingAccess(member, expiry + 72 * 3600_000 - 1)).toBe(true);
    expect(hasPaidReadingAccess(member, expiry + 72 * 3600_000)).toBe(false);
    expect(paidReadingExpiry(member)).toBe("2026-12-23T00:00:00.000Z");
  });
  it("allows rereading already opened Nuggets but not brand new selections", () => {
    expect(graceGrantExpiry(member, priorGrant, expiry + 1000)).toBe("2026-12-23T00:00:00.000Z");
    expect(graceGrantExpiry(member, undefined, expiry + 1000)).toBeNull();
    expect(graceGrantExpiry(member, { openedAt: "2026-12-21T00:00:00Z" }, expiry + 1000)).toBeNull();
  });
  it("does not provide grace to suspended, cancelled, or free accounts", () => {
    for (const invalid of [
      { accountStatus: "suspended" },
      { subscriptionStatus: "cancelled" },
      { membershipTier: "free" },
      { subscriptionPlan: "free" },
    ]) {
      expect(hasPaidReadingAccess({ ...member, ...invalid }, expiry + 1000)).toBe(false);
    }
  });
});
