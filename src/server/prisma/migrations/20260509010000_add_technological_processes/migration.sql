CREATE TABLE "technologicalProcess" (
    "id" SERIAL NOT NULL,
    "productId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "blankId" INTEGER,
    "creatorId" INTEGER NOT NULL,
    "disabledById" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "technologicalProcess_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "technologicalProcessFile" (
    "id" SERIAL NOT NULL,
    "processId" INTEGER NOT NULL,
    "originalName" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "mimeType" TEXT,
    "storagePath" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "technologicalProcessFile_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "technologicalProcess_productId_name_key" ON "technologicalProcess"("productId", "name");
CREATE INDEX "technologicalProcess_productId_idx" ON "technologicalProcess"("productId");
CREATE INDEX "technologicalProcess_blankId_idx" ON "technologicalProcess"("blankId");
CREATE INDEX "technologicalProcess_creatorId_idx" ON "technologicalProcess"("creatorId");
CREATE INDEX "technologicalProcess_disabledById_idx" ON "technologicalProcess"("disabledById");
CREATE INDEX "technologicalProcessFile_processId_idx" ON "technologicalProcessFile"("processId");

ALTER TABLE "technologicalProcess" ADD CONSTRAINT "technologicalProcess_productId_fkey"
FOREIGN KEY ("productId") REFERENCES "product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "technologicalProcess" ADD CONSTRAINT "technologicalProcess_blankId_fkey"
FOREIGN KEY ("blankId") REFERENCES "blank"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "technologicalProcess" ADD CONSTRAINT "technologicalProcess_creatorId_fkey"
FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "technologicalProcess" ADD CONSTRAINT "technologicalProcess_disabledById_fkey"
FOREIGN KEY ("disabledById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "technologicalProcessFile" ADD CONSTRAINT "technologicalProcessFile_processId_fkey"
FOREIGN KEY ("processId") REFERENCES "technologicalProcess"("id") ON DELETE CASCADE ON UPDATE CASCADE;
