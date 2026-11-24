import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { createRequire } from "node:module";
import ts from "typescript";

const require = createRequire(import.meta.url);
const source = fs.readFileSync(new URL("../lib/topic-display.ts", import.meta.url), "utf8");
const js = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const exports = {};
new Function("exports", "require", js)(exports, require);
const { displayTopicName } = exports;

test("removes imported B01T01 prefixes from visible topic names", () => {
  assert.equal(displayTopicName("B01T01 Business Calling and Purpose"), "Business Calling and Purpose");
  assert.equal(displayTopicName("B02T17: Leadership and Governance"), "Leadership and Governance");
  assert.equal(displayTopicName("b03t02 - Stewardship"), "Stewardship");
  assert.equal(displayTopicName(" B100T003 — Managing People"), "Managing People");
});
test("preserves unrelated names, names with ordinary numbers, and lone identifiers", () => {
  for (const value of ["1 John", "Business Strategy 101", "B01T01", "B01T01Business", "B01-T01 Business", "Business Calling and Purpose"]) {
    assert.equal(displayTopicName(value), value);
  }
});
test("does not mutate raw topic identifiers used for routes or Nugget matching", () => {
  const topic = { slug: "b01t01-business-calling-and-purpose", name: "B01T01 Business Calling and Purpose" };
  const nugget = { topic: topic.name };
  assert.equal(displayTopicName(topic.name), "Business Calling and Purpose");
  assert.equal(topic.slug, "b01t01-business-calling-and-purpose");
  assert.equal(topic.name, nugget.topic);
});

test("removes explicit numbered topic prefixes without stripping ordinary numbers", () => {
  assert.equal(displayTopicName("01. Business Calling"), "Business Calling");
  assert.equal(displayTopicName("2) Leadership"), "Leadership");
  assert.equal(displayTopicName("03 - Stewardship"), "Stewardship");
  assert.equal(displayTopicName("04 Money Management"), "Money Management");
  assert.equal(displayTopicName("B01T01 05. Managing People"), "Managing People");
  assert.equal(displayTopicName("1 John"), "1 John");
  assert.equal(displayTopicName("7 Habits of Leadership"), "7 Habits of Leadership");
});
