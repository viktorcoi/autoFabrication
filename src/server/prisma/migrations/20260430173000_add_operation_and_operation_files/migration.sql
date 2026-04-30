-- CreateTable
CREATE TABLE "operation" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "operationGroupId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "operation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "operationFile" (
    "id" SERIAL NOT NULL,
    "operationId" INTEGER NOT NULL,
    "originalName" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "mimeType" TEXT,
    "storagePath" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "operationFile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "operation_name_key" ON "operation"("name");

-- CreateIndex
CREATE INDEX "operation_operationGroupId_idx" ON "operation"("operationGroupId");

-- CreateIndex
CREATE INDEX "operationFile_operationId_idx" ON "operationFile"("operationId");

-- AddForeignKey
ALTER TABLE "operation" ADD CONSTRAINT "operation_operationGroupId_fkey" FOREIGN KEY ("operationGroupId") REFERENCES "operationGroup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "operationFile" ADD CONSTRAINT "operationFile_operationId_fkey" FOREIGN KEY ("operationId") REFERENCES "operation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
