CREATE TABLE "processStep" (
    "id" SERIAL NOT NULL,
    "processOperationId" INTEGER NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "processStep_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "processStepFile" (
    "id" SERIAL NOT NULL,
    "processStepId" INTEGER NOT NULL,
    "originalName" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "mimeType" TEXT,
    "storagePath" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "processStepFile_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "processStep_processOperationId_idx" ON "processStep"("processOperationId");
CREATE INDEX "processStep_sortOrder_idx" ON "processStep"("sortOrder");
CREATE INDEX "processStepFile_processStepId_idx" ON "processStepFile"("processStepId");

ALTER TABLE "processStep" ADD CONSTRAINT "processStep_processOperationId_fkey"
FOREIGN KEY ("processOperationId") REFERENCES "processOperation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "processStepFile" ADD CONSTRAINT "processStepFile_processStepId_fkey"
FOREIGN KEY ("processStepId") REFERENCES "processStep"("id") ON DELETE CASCADE ON UPDATE CASCADE;
