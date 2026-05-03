DROP INDEX IF EXISTS "blank_name_key";
DROP INDEX IF EXISTS "workGroup_name_key";
DROP INDEX IF EXISTS "work_name_key";

CREATE UNIQUE INDEX "blank_name_materialId_key" ON "blank"("name", "materialId");
CREATE UNIQUE INDEX "workGroup_name_operationId_key" ON "workGroup"("name", "operationId");
CREATE UNIQUE INDEX "work_name_workGroupId_key" ON "work"("name", "workGroupId");
