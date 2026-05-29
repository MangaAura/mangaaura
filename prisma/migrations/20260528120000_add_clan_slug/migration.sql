-- Add slug column as nullable first to backfill existing rows
ALTER TABLE "Clan" ADD COLUMN "slug" TEXT;

-- Backfill existing rows with a slug derived from name
UPDATE "Clan" SET "slug" = LOWER(REGEXP_REPLACE(TRIM("name"), '[^\w\s-]', '', 'g'));

-- Resolve duplicate slugs by appending a suffix
UPDATE "Clan" c1
SET "slug" = c1."slug" || '-' || (SELECT COUNT(*) FROM "Clan" c2 WHERE c2."slug" = c1."slug" AND c2."id" < c1."id")::TEXT
WHERE (SELECT COUNT(*) FROM "Clan" c2 WHERE c2."slug" = c1."slug") > 1;

-- Make slug required and unique
ALTER TABLE "Clan" ALTER COLUMN "slug" SET NOT NULL;
CREATE UNIQUE INDEX "Clan_slug_key" ON "Clan"("slug");
