-- CreateTable
CREATE TABLE "work" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "workGroupId" INTEGER NOT NULL,
    "tpz" DOUBLE PRECISION NOT NULL,
    "tsht" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "work_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workFile" (
    "id" SERIAL NOT NULL,
    "workId" INTEGER NOT NULL,
    "originalName" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "mimeType" TEXT,
    "storagePath" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "workFile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "work_name_key" ON "work"("name");

-- CreateIndex
CREATE INDEX "work_workGroupId_idx" ON "work"("workGroupId");

-- CreateIndex
CREATE INDEX "workFile_workId_idx" ON "workFile"("workId");

-- AddForeignKey
ALTER TABLE "work" ADD CONSTRAINT "work_workGroupId_fkey" FOREIGN KEY ("workGroupId") REFERENCES "workGroup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workFile" ADD CONSTRAINT "workFile_workId_fkey" FOREIGN KEY ("workId") REFERENCES "work"("id") ON DELETE CASCADE ON UPDATE CASCADE;
