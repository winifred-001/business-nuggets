import { summarizeTopUpLots } from "./topups-policy";
import { hasActivePaidSubscription, isPaidSubscriptionInGrace } from "../nuggets/paid-history-access";

const at = Date.parse("2026-11-23T00:00:00Z");
const paid = { accountStatus: "active", membershipTier: "premium",
  subscriptionStatus: "active", subscriptionPlan: "premium-monthly",
  subscriptionExpiresAt: "2026-11-22T00:00:00Z" };

describe("Top-up three-month credit validity and renewal rules", () => {
  it("keeps a Top-up lot on the account after subscription expiry until its own expiry, without allowing redemption during inactivity", () => {
    const wallet = summarizeTopUpLots([
      { totalCredits: 4, remainingCredits: 4, originalExpiresAt: "2027-01-15T00:00:00Z" },
    ], at);
    expect(wallet.balance).toBe(4);
    expect(wallet.expired).toBe(0);
    expect(wallet.invalidated).toBe(0);
    expect(wallet.nextExpiryAt).toBe("2027-01-15T00:00:00Z");
    expect(isPaidSubscriptionInGrace(paid, at)).toBe(true);
    expect(hasActivePaidSubscription(paid, at)).toBe(false);
    expect(hasActivePaidSubscription({ ...paid, subscriptionExpiresAt: "2026-12-22T00:00:00Z" }, at)).toBe(true);
  });

  it("removes all unused pre-renewal credits from the available balance even when their three-month expiry is later", () => {
    const wallet = summarizeTopUpLots([
      { totalCredits: 4, remainingCredits: 4, originalExpiresAt: "2027-01-15T00:00:00Z", invalidatedAt: "2026-11-20T00:00:00Z" },
    ], at);
    expect(wallet).toEqual({
      balance: 0, lifetimePurchased: 4, lifetimeUsed: 0,
      expired: 0, invalidated: 4, nextExpiryAt: null,
    });
  });

  it("expires unused credits at the exact three-month expiry timestamp", () => {
    const wallet = summarizeTopUpLots([
      { totalCredits: 4, remainingCredits: 4, originalExpiresAt: "2027-01-15T00:00:00Z" },
    ], Date.parse("2027-01-15T00:00:00Z"));
    expect(wallet).toEqual({
      balance: 0, lifetimePurchased: 4, lifetimeUsed: 0,
      expired: 4, invalidated: 0, nextExpiryAt: null,
    });
  });

  it("does not count expired or renewal-invalidated credits as available or as credits already spent", () => {
    const wallet = summarizeTopUpLots([
      { totalCredits: 5, remainingCredits: 2, originalExpiresAt: "2026-10-01T00:00:00Z" },
      { totalCredits: 3, remainingCredits: 1, originalExpiresAt: "2026-12-01T00:00:00Z", invalidatedAt: "2026-11-01T00:00:00Z" },
      { totalCredits: 2, remainingCredits: 1, originalExpiresAt: "2026-12-01T00:00:00Z" },
    ], at);
    expect(wallet).toEqual({
      balance: 1, lifetimePurchased: 10, lifetimeUsed: 6,
      expired: 2, invalidated: 1, nextExpiryAt: "2026-12-01T00:00:00Z",
    });
  });

  it("does not generate new credits from repeated calculations", () => {
    const lots = [{ totalCredits: 3, remainingCredits: 0, originalExpiresAt: "2026-12-01T00:00:00Z" }];
    expect(summarizeTopUpLots(lots, at).balance).toBe(0);
  });
});
