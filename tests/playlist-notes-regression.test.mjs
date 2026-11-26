import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
const read = path => fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("dark note and playlist panels retain light foregrounds", () => {
  const css = read("app/cream-pages.css");
  assert.match(css, /\[class~="bg-\[#101010\]"\]/);
  const notes = read("app/library/personal-notes/page.tsx");
  assert.match(notes, /bn-dark-surface bg-\[#101010\]/);
  assert.match(notes, /aria-label="Note content"[\s\S]*?className="[^"]*text-white/);
});
test("playlist schema changes are explicitly deployed, never run in requests", () => {
  const service = read("backend/src/playlists/playlists.service.ts");
  assert.doesNotMatch(service, /ALTER TABLE|ensureMetadata\(/);
  const migration = read("backend/ops/sql/20261126_playlist_metadata.sql");
  assert.match(migration, /ADD COLUMN IF NOT EXISTS "description"/);
  assert.match(migration, /ADD COLUMN IF NOT EXISTS "shareToken"/);
  assert.match(migration, /CREATE UNIQUE INDEX IF NOT EXISTS/);
});
