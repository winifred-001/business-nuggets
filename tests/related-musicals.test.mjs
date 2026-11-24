import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { createRequire } from "node:module";
import ts from "typescript";

const require = createRequire(import.meta.url);
const source = fs.readFileSync(new URL("../lib/related-musicals.ts", import.meta.url), "utf8");
const js = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const exports = {};
new Function("exports", "require", js)(exports, require);
const { selectRelatedMusicals } = exports;

test("related musicals use the first four audio-bearing items in the same topic", () => {
  const current = { slug: "current", topic: "Leadership", audioUrl: "current.mp3" };
  const items = [
    current,
    { slug: "wrong-topic", topic: "Finance", audioUrl: "other.mp3" },
    { slug: "no-music", topic: "Leadership", nuggetAudioUrl: "commentary.mp3" },
    { slug: "a", topic: " leadership ", audioUrl: "a.mp3" },
    { slug: "b", topic: "Leadership", musicalAudioUrl: "b.mp3" },
    { slug: "c", topic: "Leadership", audioUrl: "c.mp3" },
    { slug: "d", topic: "Leadership", audioUrl: "d.mp3" },
    { slug: "e", topic: "Leadership", audioUrl: "e.mp3" },
  ];
  assert.deepEqual(selectRelatedMusicals(current, items).map(item => item.slug), ["a", "b", "c", "d"]);
});

test("related musicals do not fill empty slots with unrelated or missing audio items", () => {
  const current = { slug: "current", topic: "Leadership" };
  assert.deepEqual(selectRelatedMusicals(current, [
    { slug: "other", topic: "Finance", audioUrl: "other.mp3" },
    { slug: "missing", topic: "Leadership", audioUrl: " " },
  ]), []);
});
