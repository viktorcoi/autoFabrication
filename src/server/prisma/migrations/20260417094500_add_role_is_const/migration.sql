ALTER TABLE "Role"
ADD COLUMN "isConst" BOOLEAN NOT NULL DEFAULT false;

UPDATE "Role"
SET "isConst" = true
WHERE "name" = 'Admin';
