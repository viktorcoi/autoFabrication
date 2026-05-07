CREATE TABLE "product" (
	"id" SERIAL NOT NULL,
	"name" TEXT NOT NULL,
	"description" TEXT,
	"typeProductId" INTEGER NOT NULL,
	"materialId" INTEGER NOT NULL,
	"creatorId" INTEGER NOT NULL,
	"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
	"updatedAt" TIMESTAMP(3) NOT NULL,

	CONSTRAINT "product_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "productFile" (
	"id" SERIAL NOT NULL,
	"productId" INTEGER NOT NULL,
	"originalName" TEXT NOT NULL,
	"size" INTEGER NOT NULL,
	"mimeType" TEXT,
	"storagePath" TEXT NOT NULL,
	"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

	CONSTRAINT "productFile_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "productImage" (
	"id" SERIAL NOT NULL,
	"productId" INTEGER NOT NULL,
	"originalName" TEXT NOT NULL,
	"size" INTEGER NOT NULL,
	"mimeType" TEXT,
	"storagePath" TEXT NOT NULL,
	"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

	CONSTRAINT "productImage_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "productComponent" (
	"id" SERIAL NOT NULL,
	"productId" INTEGER NOT NULL,
	"componentProductId" INTEGER NOT NULL,
	"count" INTEGER NOT NULL,
	"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
	"updatedAt" TIMESTAMP(3) NOT NULL,

	CONSTRAINT "productComponent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "product_name_typeProductId_materialId_key" ON "product"("name", "typeProductId", "materialId");
CREATE INDEX "product_typeProductId_idx" ON "product"("typeProductId");
CREATE INDEX "product_materialId_idx" ON "product"("materialId");
CREATE INDEX "product_creatorId_idx" ON "product"("creatorId");
CREATE INDEX "productFile_productId_idx" ON "productFile"("productId");
CREATE INDEX "productImage_productId_idx" ON "productImage"("productId");
CREATE UNIQUE INDEX "productComponent_productId_componentProductId_key" ON "productComponent"("productId", "componentProductId");
CREATE INDEX "productComponent_componentProductId_idx" ON "productComponent"("componentProductId");

ALTER TABLE "product"
ADD CONSTRAINT "product_typeProductId_fkey"
FOREIGN KEY ("typeProductId") REFERENCES "TypeProduct"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "product"
ADD CONSTRAINT "product_materialId_fkey"
FOREIGN KEY ("materialId") REFERENCES "material"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "product"
ADD CONSTRAINT "product_creatorId_fkey"
FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "productFile"
ADD CONSTRAINT "productFile_productId_fkey"
FOREIGN KEY ("productId") REFERENCES "product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "productImage"
ADD CONSTRAINT "productImage_productId_fkey"
FOREIGN KEY ("productId") REFERENCES "product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "productComponent"
ADD CONSTRAINT "productComponent_productId_fkey"
FOREIGN KEY ("productId") REFERENCES "product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "productComponent"
ADD CONSTRAINT "productComponent_componentProductId_fkey"
FOREIGN KEY ("componentProductId") REFERENCES "product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "productComponent"
ADD CONSTRAINT "productComponent_count_check" CHECK ("count" > 0);

ALTER TABLE "productComponent"
ADD CONSTRAINT "productComponent_not_self_check" CHECK ("productId" <> "componentProductId");
