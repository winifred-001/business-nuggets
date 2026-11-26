/** Summarize Top-up credit lots, excluding naturally expired and renewal-invalidated credits. */
export function summarizeTopUpLots(
  lots: readonly {
    totalCredits: number;
    remainingCredits: number;
    originalExpiresAt: string;
    invalidatedAt?: string | null;
  }[],
  now = Date.now(),
) {
  const activeLots = lots.filter(lot =>
    !lot.invalidatedAt && Date.parse(lot.originalExpiresAt) > now,
  );
  const expiredLots = lots.filter(lot =>
    !lot.invalidatedAt && Date.parse(lot.originalExpiresAt) <= now,
  );
  const invalidatedLots = lots.filter(lot => Boolean(lot.invalidatedAt));
  const balance = activeLots.reduce((sum, lot) => sum + lot.remainingCredits, 0);
  const expired = expiredLots.reduce((sum, lot) => sum + lot.remainingCredits, 0);
  const invalidated = invalidatedLots.reduce((sum, lot) => sum + lot.remainingCredits, 0);
  const lifetimePurchased = lots.reduce((sum, lot) => sum + lot.totalCredits, 0);
  const remainingAcrossAllLots = lots.reduce((sum, lot) => sum + lot.remainingCredits, 0);
  const lifetimeUsed = lifetimePurchased - remainingAcrossAllLots;
  const nextExpiryAt = activeLots
    .filter(lot => lot.remainingCredits > 0)
    .sort((a, b) => Date.parse(a.originalExpiresAt) - Date.parse(b.originalExpiresAt))[0]?.originalExpiresAt ?? null;
  return { balance, lifetimePurchased, lifetimeUsed, expired, invalidated, nextExpiryAt };
}
