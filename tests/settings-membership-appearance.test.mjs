import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
const read = path => fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("account switches have a bounded track and anchored knob", () => {
  const page = read("app/library/account/page.tsx");
  const css = read("app/library/account/settings.module.css");
  assert.match(page, /role="switch"[\s\S]*?aria-label=\{label\}/);
  assert.equal((page.match(/<Switch\b/g) || []).length, 4);
  assert.match(css, /\.switchTrack\s*\{[\s\S]*?width: 44px;[\s\S]*?overflow: hidden;/);
  assert.match(css, /\.switchKnob\s*\{[\s\S]*?left: 2px;[\s\S]*?width: 20px;/);
  assert.match(css, /translateX\(20px\)/);
  assert.match(css, /color: #FFC46B !important/);
});
test("membership prices do not split and top-ups retain a dark surface", () => {
  const plans = read("components/PremiumCheckout.tsx");
  assert.match(plans, /flex flex-wrap items-start justify-between gap-x-4 gap-y-3/);
  assert.match(plans, /shrink-0 whitespace-nowrap font-serif/);
  const topups = read("components/TopUpBundles.tsx");
  assert.match(topups, /id="topups" className="bn-dark-surface[^"]*bg-\[#111111\]/);
  assert.match(topups, /whitespace-nowrap[^"]*tabular-nums text-white">\{formatMoney/);
});
