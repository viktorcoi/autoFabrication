CREATE TABLE "processOperation" (
    "id" SERIAL NOT NULL,
    "processId" INTEGER NOT NULL,
    "operationId" INTEGER NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "exit" INTEGER,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "processOperation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "processOperationFile" (
    "id" SERIAL NOT NULL,
    "processOperationId" INTEGER NOT NULL,
    "originalName" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "mimeType" TEXT,
    "storagePath" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "processOperationFile_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "processOperation_processId_operationId_key" ON "processOperation"("processId", "operationId");
CREATE INDEX "processOperation_processId_idx" ON "processOperation"("processId");
CREATE INDEX "processOperation_operationId_idx" ON "processOperation"("operationId");
CREATE INDEX "processOperation_sortOrder_idx" ON "processOperation"("sortOrder");
CREATE INDEX "processOperationFile_processOperationId_idx" ON "processOperationFile"("processOperationId");

ALTER TABLE "processOperation" ADD CONSTRAINT "processOperation_processId_fkey"
FOREIGN KEY ("processId") REFERENCES "technologicalProcess"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "processOperation" ADD CONSTRAINT "processOperation_operationId_fkey"
FOREIGN KEY ("operationId") REFERENCES "operation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "processOperationFile" ADD CONSTRAINT "processOperationFile_processOperationId_fkey"
FOREIGN KEY ("processOperationId") REFERENCES "processOperation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
