import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

function read(path) {
  return fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

test("remaining customer screens opt into the cream page palette", () => {
  for (const path of [
  "app/home/page.tsx",
  "app/authors/page.tsx",
  "app/authors/[slug]/page.tsx",
  "app/challenges/[slug]/page.tsx",
  "app/collection/[slug]/page.tsx",
  "app/kingdom-principles/page.tsx",
  "app/library/account/page.tsx",
  "app/library/history/page.tsx",
  "app/library/personal-notes/create/page.tsx",
  "app/library/personal-notes/page.tsx",
  "app/library/playlist/[id]/edit/page.tsx",
  "app/library/playlist/add/page.tsx",
  "app/library/playlist/create/page.tsx",
  "app/library/playlist/page.tsx",
  "app/library/playlist/[id]/page.tsx",
  "app/library/saved-nuggets/create-folder/page.tsx",
  "app/library/saved-nuggets/folder/[id]/page.tsx",
  "app/library/saved-nuggets/page.tsx",
  "app/membership/page.tsx",
  "app/musicals/page.tsx",
  "app/notifications/page.tsx",
  "app/nugget/[id]/audio/page.tsx",
  "app/nugget/[id]/musical/page.tsx",
  "app/onboarding/page.tsx",
  "app/onboarding-complete/page.tsx",
  "app/recommendations/page.tsx",
  "app/workspace/page.tsx",
  "app/playlist/[id]/page.tsx",
  "app/shared-playlist/[token]/page.tsx",
  "app/search/page.tsx",
  "app/scripture-index/[slug]/page.tsx",
  "app/topics/[slug]/page.tsx",
  "app/payment/callback/page.tsx",
  "app/forgot-password/page.tsx",
  "app/reset-password/page.tsx",
  "app/reset-link-sent/page.tsx",
  "app/password-reset-success/page.tsx",
  "app/not-found.tsx",
  "components/LibraryEmptyPage.tsx",
  "components/PremiumNuggetGate.tsx",
  "components/NuggetAccessLimitGate.tsx",
  "components/NuggetAccessExpiryGate.tsx",
  "app/library/page.tsx"
]) {
    assert.match(read(path), /bn-cream-page[^"\n]*bg-\[#F5F0E8\]/, path);
  }
});

test("cream styling is scoped and authentication screens do not opt in", () => {
  assert.match(read("app/layout.tsx"), /import "\.\/cream-pages\.css"/);
  assert.match(read("app/cream-pages.css"), /\.bn-cream-page\s*\{/);
  assert.match(read("app/cream-pages.css"), /--bn-page-fg: #211E19/);
  assert.match(read("app/cream-pages.css"), /--bn-page-fg: #FAF9F6/);
  for (const path of ["app/login/page.tsx", "app/register/page.tsx", "app/admin/layout.tsx"]) {
    assert.doesNotMatch(read(path), /bn-cream-page/, path);
  }
  assert.match(read("app/pages/[slug]/page.tsx"), /<InformationLayout light/);
});
