# Subscription Top-ups: safe release checklist

This feature is **not live** until explicitly approved and deployed. The code does
not delete or rewrite existing member subscriptions, Nugget grants or payments.

## Business rules
- Paid Monthly and Annual subscriptions both receive the plan's monthly Nugget allowance.
- After consuming it, a member with an *active* paid subscription may spend Top-up credits.
- A Top-up gives extra selections; it does not change the subscription expiry.
- Each Top-up purchase creates a credit lot that expires exactly three calendar months after purchase.
- The three-month credit period is independent of the subscription period. If the subscription expires first, unused Top-up credits remain valid until their own expiry date.
- Expired unused credits are removed from the available balance and cannot be redeemed. The oldest-expiring valid lot is consumed first.
- Credits remain on the account when the subscription expires, but can only be spent while the member has an active paid subscription. After renewal, any credits still within their three-month validity period can be redeemed.
- During the 72 hours after paid expiry, members may reread Nuggets already granted;
  no new Nuggets or Top-up redemptions are allowed. After 72 hours paid reads lock.
- A member suspended, revoked or cancelled has no grace access.

## Pre-deployment actions
1. Take a verified, restorable production database backup.
2. Apply `backend/ops/sql/20261123_topups.sql` to **staging**, then run a
   least-privilege smoke test for CRUD, reads and lot sequence usage.
   The backend only checks that these tables exist; it deliberately does not
   issue CREATE TABLE from customer requests. Set up schema with a migration role.
3. Ensure the runtime DB role has SELECT/INSERT/UPDATE on the new tables and
   USAGE/SELECT on `NuggetTopUpCreditLot_id_seq`.
4. Create test bundles in Admin → Subscriptions → Top-ups. No real pricing is seeded; credit validity is fixed at three calendar months and is not configurable.
5. Test Paystack end-to-end in test mode: callback and webhook, replay the same
   reference repeatedly, check one credit lot only, verify matching amount and
   currency, reject unverified/pending orders, and check payment failures.
6. Test concurrent openings and double-clicks near quota exhaustion. Credits must
   never become negative; same Nugget cannot consume two credits.
7. Test paid expiry at T−1s, T, T+71h59m, and T+72h; verify that cancelled
   and suspended users cannot bypass the grace check.
8. Test a Top-up purchased before subscription expiry, then let the subscription
   expire first. Confirm its unused credits remain valid until purchase date +
   three calendar months, cannot be redeemed while membership is inactive, and
   become usable again after renewal only if they have not expired.
9. Test the exact credit-expiry boundary and confirm expired credits are excluded
   from wallet balance and cannot be redeemed. Test oldest-expiring-first debit.
10. Test new paid renewal and annual upgrades and verify that credits do not
    change the paid expiry or reset the monthly allowance.
11. Confirm CI, log/error monitoring, and explicit deployment approval.

## Rollback / recovery
- Disable active bundles through Admin first to stop new purchases.
- Restore the earlier application build if needed, but **retain** the new tables:
  they contain financial purchase and entitlement records; do not drop them.
- On an incident, reconcile every paid BillingTransaction planSlug starting
  `topup:` to its unique credit-lot reference.
- Do not reverse spent credits or alter paid transaction rows without an
  audited support/reconciliation procedure.

## Known deployment boundary
The CI suite verifies code/test/build integration but does not supply a live
PostgreSQL or real Paystack integration environment. Do not regard green CI
as proof of production billing readiness.
