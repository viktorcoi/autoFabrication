CREATE TABLE "processWork" (
    "id" SERIAL NOT NULL,
    "processStepId" INTEGER NOT NULL,
    "workId" INTEGER NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "count" INTEGER NOT NULL DEFAULT 1,
    "tpz" DOUBLE PRECISION NOT NULL,
    "tsht" DOUBLE PRECISION NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "processWork_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "processWork_processStepId_workId_key" ON "processWork"("processStepId", "workId");
CREATE INDEX "processWork_processStepId_idx" ON "processWork"("processStepId");
CREATE INDEX "processWork_workId_idx" ON "processWork"("workId");
CREATE INDEX "processWork_sortOrder_idx" ON "processWork"("sortOrder");

ALTER TABLE "processWork" ADD CONSTRAINT "processWork_processStepId_fkey"
FOREIGN KEY ("processStepId") REFERENCES "processStep"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "processWork" ADD CONSTRAINT "processWork_workId_fkey"
FOREIGN KEY ("workId") REFERENCES "work"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
