/** Summarize credit lots using each lot's independent three-month expiry. */
export function summarizeTopUpLots(
  lots: readonly { totalCredits: number; remainingCredits: number; originalExpiresAt: string }[],
  now = Date.now(),
) {
  const activeLots = lots.filter(lot => Date.parse(lot.originalExpiresAt) > now);
  const expiredLots = lots.filter(lot => Date.parse(lot.originalExpiresAt) <= now);
  const balance = activeLots.reduce((sum, lot) => sum + lot.remainingCredits, 0);
  const expired = expiredLots.reduce((sum, lot) => sum + lot.remainingCredits, 0);
  const lifetimePurchased = lots.reduce((sum, lot) => sum + lot.totalCredits, 0);
  const remainingAcrossAllLots = lots.reduce((sum, lot) => sum + lot.remainingCredits, 0);
  const lifetimeUsed = lifetimePurchased - remainingAcrossAllLots;
  const nextExpiryAt = activeLots
    .filter(lot => lot.remainingCredits > 0)
    .sort((a, b) => Date.parse(a.originalExpiresAt) - Date.parse(b.originalExpiresAt))[0]?.originalExpiresAt ?? null;
  return { balance, lifetimePurchased, lifetimeUsed, expired, nextExpiryAt };
}
