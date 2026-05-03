-- CreateTable
CREATE TABLE "workGroup" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "operationId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workGroup_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "workGroup_name_key" ON "workGroup"("name");

-- CreateIndex
CREATE INDEX "workGroup_operationId_idx" ON "workGroup"("operationId");

-- AddForeignKey
ALTER TABLE "workGroup" ADD CONSTRAINT "workGroup_operationId_fkey" FOREIGN KEY ("operationId") REFERENCES "operation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
