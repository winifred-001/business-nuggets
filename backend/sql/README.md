# Standalone SQL references

These scripts are not Prisma 8 migration packages and must remain outside `migrations/`.
The CommentReport table is also created lazily by ModerationService. Its standalone SQL
is retained here for manual setup without breaking Prisma's migration graph validation.
