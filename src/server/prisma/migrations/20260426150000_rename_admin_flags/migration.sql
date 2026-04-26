ALTER TABLE "Role"
RENAME COLUMN "isConst" TO "isAdmin";

ALTER TABLE "User"
ADD COLUMN "isAdmin" BOOLEAN NOT NULL DEFAULT false;

UPDATE "User"
SET "isAdmin" = true
WHERE "id" = (
	SELECT MIN("id")
	FROM "User"
);
