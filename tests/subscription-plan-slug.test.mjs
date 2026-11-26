import assert from "node:assert/strict";
import { test } from "node:test";
import { createRequire } from "node:module";
import fs from "node:fs";
import ts from "typescript";

const require = createRequire(import.meta.url);
const source = fs.readFileSync(new URL("../lib/subscription-plan-slug.ts", import.meta.url), "utf8");
const transpiled = ts.transpileModule(source, { compilerOptions: {
  module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022,
} }).outputText;
const exports = {};
new Function("exports", "require", transpiled)(exports, require);
const { subscriptionPlanSlug } = exports;

test("generates a valid slug from a plan name automatically", () => {
  assert.equal(subscriptionPlanSlug("Free Reader"), "free-reader");
  assert.equal(subscriptionPlanSlug("Premium Annual"), "premium-annual");
  assert.equal(subscriptionPlanSlug("Business & Wisdom!"), "business-and-wisdom");
  assert.equal(subscriptionPlanSlug("  Monthly / Plus  "), "monthly-plus");
});
test("normalizes accents and limits slug length", () => {
  assert.equal(subscriptionPlanSlug("Élite Reader"), "elite-reader");
  assert.ok(subscriptionPlanSlug("Premium ".repeat(30)).length <= 80);
  assert.match(subscriptionPlanSlug("Premium ".repeat(30)), /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
});
