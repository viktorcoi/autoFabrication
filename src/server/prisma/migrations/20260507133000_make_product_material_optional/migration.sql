ALTER TABLE "product"
ALTER COLUMN "materialId" DROP NOT NULL;

CREATE UNIQUE INDEX "product_name_typeProductId_materialId_null_key"
ON "product"("name", "typeProductId")
WHERE "materialId" IS NULL;
