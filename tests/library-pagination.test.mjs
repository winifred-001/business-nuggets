import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { createRequire } from "node:module";
import ts from "typescript";

const require = createRequire(import.meta.url);
const source = fs.readFileSync(new URL("../lib/library-pagination.ts", import.meta.url), "utf8");
const js = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const exports = {};
new Function("exports", "require", js)(exports, require);
const { libraryPageNumbers } = exports;

test("page one shows 1–15, an ellipsis, and the last two pages", () => {
  assert.deepEqual(libraryPageNumbers(80, 1), [
    ...Array.from({ length: 15 }, (_, index) => index + 1), "ellipsis", 79, 80,
  ]);
});
test("next-page navigation reveals the next previously hidden page", () => {
  assert.deepEqual(libraryPageNumbers(80, 2), [
    ...Array.from({ length: 15 }, (_, index) => index + 2), "ellipsis", 79, 80,
  ]);
  assert.deepEqual(libraryPageNumbers(80, 16).slice(0, 4), [16, 17, 18, 19]);
});
test("near the end, pages do not overlap or repeat and current page remains visible", () => {
  for (const page of [62, 63, 64, 79, 80]) {
    const visible = libraryPageNumbers(80, page);
    const numbers = visible.filter(value => typeof value === "number");
    assert.ok(numbers.includes(page));
    assert.equal(numbers.length, new Set(numbers).size);
    assert.equal(visible.at(-1), 80);
    assert.equal(visible.at(-2), 79);
  }
});
test("small result sets show all pages with no ellipsis", () => {
  assert.deepEqual(libraryPageNumbers(6, 1), [1, 2, 3, 4, 5, 6]);
  assert.deepEqual(libraryPageNumbers(17, 8), Array.from({ length: 17 }, (_, index) => index + 1));
  assert.deepEqual(libraryPageNumbers(1, 1), [1]);
});
test("current page input is clamped to valid bounds", () => {
  assert.deepEqual(libraryPageNumbers(80, -9), libraryPageNumbers(80, 1));
  assert.ok(libraryPageNumbers(80, 999).includes(80));
});
