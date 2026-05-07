ALTER TABLE "productImage"
ADD COLUMN "sortOrder" INTEGER NOT NULL DEFAULT 0;

UPDATE "productImage"
SET "sortOrder" = "id";
