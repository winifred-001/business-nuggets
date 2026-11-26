/**
 * The monthly Nugget selection allowance runs for one calendar month from
 * the first selected Nugget, not a hard-coded 720 hours. Clamps the day for
 * short months: January 31 -> February 28/29.
 *
 * UTC avoids server timezone and daylight-saving time inconsistencies.
 */
export function monthlyNuggetAllowanceExpiry(startedAt: string): string {
  const start = new Date(startedAt);
  if (!Number.isFinite(start.getTime())) throw new RangeError("Invalid allowance start date");
  const year = start.getUTCFullYear();
  const nextMonth = start.getUTCMonth() + 1;
  const lastDay = new Date(Date.UTC(year, nextMonth + 1, 0)).getUTCDate();
  const end = new Date(Date.UTC(
    year, nextMonth, Math.min(start.getUTCDate(), lastDay),
    start.getUTCHours(), start.getUTCMinutes(), start.getUTCSeconds(), start.getUTCMilliseconds(),
  ));
  return end.toISOString();
}
