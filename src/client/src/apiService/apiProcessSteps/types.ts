import {TableRow} from "@/components/Table/types";

export interface ProcessStepFileItem {
    id: number;
    name: string;
    size: number;
}

export interface ProcessStepTableRow extends TableRow {
    id: number;
    index: number;
    name: string;
    tpz: number | "";
    tsht: number | "";
    workCount: number | "";
    files: ProcessStepFileItem[];
    filesDownload: string;
    description: string;
    canEdit: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface ProcessStepSelectedItem {
    id: number;
    clientId: string;
    sortOrder: number;
    name: string;
    description: string;
    files: ProcessStepFileItem[];
}

export interface GetByIdProcessStepResponse {
    id: number;
    processOperationId: number;
    sortOrder: number;
    name: string;
    description: string | null;
    createdAt: string;
    updatedAt: string;
    files: ProcessStepFileItem[];
    processOperation: {
        id: number;
        processId: number;
        operation: {
            id: number;
            name: string;
        };
        process: {
            id: number;
            name: string;
            productId: number;
            creatorId: number;
            disabledById: number | null;
        };
    };
}

export interface ProcessStepFormItem {
    id: number | null;
    clientId: string;
    name: string;
    description: string;
    files: File[];
    existingFiles: ProcessStepFileItem[];
    removedFileIds?: number[];
}

export interface PostProcessStepOptions {
    name: string;
    description?: string;
    files?: File[];
}

export interface PatchProcessStepOptions {
    name?: string;
    description?: string;
    files?: File[];
    removedFileIds?: number[];
}

export interface PutProcessStepsOptions {
    items: ProcessStepFormItem[];
}

export type GetProcessStepsTableFilters = {
    operationId: number;
};
