CREATE TABLE IF NOT EXISTS "CommentReport" (
  "commentId" integer NOT NULL,
  "userId" integer NOT NULL,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "CommentReport_pkey" PRIMARY KEY ("commentId", "userId"),
  CONSTRAINT "CommentReport_commentId_fkey"
    FOREIGN KEY ("commentId") REFERENCES "Comment"("id") ON DELETE CASCADE,
  CONSTRAINT "CommentReport_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "CommentReport_userId_idx"
  ON "CommentReport" ("userId");
