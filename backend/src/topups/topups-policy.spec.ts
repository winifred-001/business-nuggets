import { summarizeTopUpLots } from "./topups-policy";
import { hasActivePaidSubscription, isPaidSubscriptionInGrace } from "../nuggets/paid-history-access";

const at = Date.parse("2026-11-23T00:00:00Z");
const paid = { accountStatus: "active", membershipTier: "premium",
  subscriptionStatus: "active", subscriptionPlan: "premium-monthly",
  subscriptionExpiresAt: "2026-11-22T00:00:00Z" };

describe("Top-up three-month credit validity and subscription expiry", () => {
  it("keeps credits valid after the subscription expires if their own three-month period has not ended", () => {
    const wallet = summarizeTopUpLots([
      { totalCredits: 4, remainingCredits: 4, originalExpiresAt: "2027-01-15T00:00:00Z" },
    ], at);
    expect(wallet.balance).toBe(4);
    expect(wallet.expired).toBe(0);
    expect(wallet.nextExpiryAt).toBe("2027-01-15T00:00:00Z");
    expect(isPaidSubscriptionInGrace(paid, at)).toBe(true);
    expect(hasActivePaidSubscription(paid, at)).toBe(false);
    expect(hasActivePaidSubscription({ ...paid, subscriptionExpiresAt: "2026-12-22T00:00:00Z" }, at)).toBe(true);
  });

  it("expires unused credits at the exact three-month expiry timestamp", () => {
    const wallet = summarizeTopUpLots([
      { totalCredits: 4, remainingCredits: 4, originalExpiresAt: "2027-01-15T00:00:00Z" },
    ], Date.parse("2027-01-15T00:00:00Z"));
    expect(wallet).toEqual({
      balance: 0, lifetimePurchased: 4, lifetimeUsed: 0,
      expired: 4, nextExpiryAt: null,
    });
  });

  it("does not count expired credits as available or as credits already spent", () => {
    const wallet = summarizeTopUpLots([
      { totalCredits: 5, remainingCredits: 2, originalExpiresAt: "2026-10-01T00:00:00Z" },
      { totalCredits: 3, remainingCredits: 1, originalExpiresAt: "2026-12-01T00:00:00Z" },
    ], at);
    expect(wallet).toEqual({
      balance: 1, lifetimePurchased: 8, lifetimeUsed: 5,
      expired: 2, nextExpiryAt: "2026-12-01T00:00:00Z",
    });
  });

  it("does not generate new credits from repeated calculations", () => {
    const lots = [{ totalCredits: 3, remainingCredits: 0, originalExpiresAt: "2026-12-01T00:00:00Z" }];
    expect(summarizeTopUpLots(lots, at).balance).toBe(0);
  });
});
