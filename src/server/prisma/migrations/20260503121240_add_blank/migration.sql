-- CreateTable
CREATE TABLE "blank" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "materialId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "blank_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "blank_name_key" ON "blank"("name");

-- CreateIndex
CREATE INDEX "blank_materialId_idx" ON "blank"("materialId");

-- AddForeignKey
ALTER TABLE "blank" ADD CONSTRAINT "blank_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "material"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
