-- CreateTable
CREATE TABLE "material" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "materialGroupId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "material_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "material_name_key" ON "material"("name");

-- CreateIndex
CREATE INDEX "material_materialGroupId_idx" ON "material"("materialGroupId");

-- AddForeignKey
ALTER TABLE "material" ADD CONSTRAINT "material_materialGroupId_fkey" FOREIGN KEY ("materialGroupId") REFERENCES "materialGroup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
