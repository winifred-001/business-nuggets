/**
 * All 72 hours of post-expiry grace allow rereading already opened paid Nuggets,
 * never new paid selections. Suspended or cancelled memberships get no grace.
 */
export const PAID_READING_GRACE_MS = 3 * 24 * 60 * 60 * 1000;

export type PaidHistoryMember = {
  accountStatus: string;
  membershipTier: string;
  subscriptionPlan: string | null;
  subscriptionStatus: string | null;
  subscriptionExpiresAt: string | null;
};

function eligible(member: PaidHistoryMember) {
  return member.accountStatus === "active" &&
    member.membershipTier === "premium" &&
    (member.subscriptionStatus === "active" || member.subscriptionStatus === "grace") &&
    Boolean(member.subscriptionPlan && member.subscriptionPlan !== "free");
}

export function hasActivePaidSubscription(member: PaidHistoryMember, now = Date.now()): boolean {
  const expires = Date.parse(member.subscriptionExpiresAt ?? "");
  return eligible(member) && Number.isFinite(expires) && expires > now;
}

export function isPaidSubscriptionInGrace(member: PaidHistoryMember, now = Date.now()): boolean {
  const expires = Date.parse(member.subscriptionExpiresAt ?? "");
  return eligible(member) && Number.isFinite(expires) &&
    expires <= now && now < expires + PAID_READING_GRACE_MS;
}

export function hasPaidReadingAccess(member: PaidHistoryMember, now = Date.now()): boolean {
  return hasActivePaidSubscription(member, now) || isPaidSubscriptionInGrace(member, now);
}

export function paidReadingExpiry(member: PaidHistoryMember): string | null {
  if (!member.subscriptionExpiresAt) return null;
  const expires = Date.parse(member.subscriptionExpiresAt);
  return Number.isFinite(expires) ? new Date(expires + PAID_READING_GRACE_MS).toISOString() : null;
}

/** Grace only covers previous server-recorded Nugget grants, not new openings. */
export function graceGrantExpiry(
  member: PaidHistoryMember,
  grant: { openedAt: string } | undefined,
  now = Date.now(),
): string | null {
  if (!isPaidSubscriptionInGrace(member, now) || !grant) return null;
  const openedAt = Date.parse(grant.openedAt);
  const expiry = Date.parse(member.subscriptionExpiresAt ?? "");
  return Number.isFinite(openedAt) && openedAt < expiry ? paidReadingExpiry(member) : null;
}

export function restoredPaidHistoryExpiry(
  member: PaidHistoryMember,
  verifiedPaidAt: string | null,
  grant: { openedAt: string } | undefined,
  now = Date.now(),
): string | null {
  if (!hasPaidReadingAccess(member, now) || !grant || !verifiedPaidAt) return null;
  const openedAt = Date.parse(grant.openedAt);
  const paymentAt = Date.parse(verifiedPaidAt);
  if (!Number.isFinite(openedAt) || !Number.isFinite(paymentAt) || paymentAt <= openedAt) return null;
  return paidReadingExpiry(member);
}
