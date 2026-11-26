-- Run as the Playlist table owner / migration role before deploying the API.
-- Preserves all existing playlists, items, descriptions and share tokens.
BEGIN;
ALTER TABLE public."Playlist"
  ADD COLUMN IF NOT EXISTS "description" text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS "shareToken" text;
-- Multiple NULL tokens are allowed; existing shared links are preserved.
CREATE UNIQUE INDEX IF NOT EXISTS "Playlist_shareToken_key"
  ON public."Playlist" ("shareToken");
COMMIT;
-- No runtime role DDL privileges are required.
