import {TableRow} from "@/components/Table/types";

export interface ProcessOperationFileItem {
    id: number;
    name: string;
    size: number;
}

export interface ProcessOperationGuideFileItem {
    id: number;
    name: string;
    size: number;
}

export interface ProcessOperationTableRow extends TableRow {
    id: number;
    index: number;
    name: string;
    tpz: number | "";
    tsht: number | "";
    stepCount: number | "";
    operationGroup: string;
    files: ProcessOperationFileItem[];
    filesDownload: string;
    exit: number | "";
    description: string;
    operationId: number;
    canEdit: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface ProcessOperationSelectedItem {
    id: number;
    operationId: number;
    name: string;
    operationGroup: string;
    operationGroupId: number;
    sortOrder: number;
}

export interface GetByIdProcessOperationResponse {
    id: number;
    processId: number;
    operationId: number;
    sortOrder: number;
    exit: number | null;
    description: string | null;
    createdAt: string;
    updatedAt: string;
    files: ProcessOperationFileItem[];
    process: {
        id: number;
        name: string;
        disabledById: number | null;
    };
    operation: {
        id: number;
        name: string;
        description: string | null;
        operationGroupId: number;
        operationGroup: {
            id: number;
            name: string;
            description: string | null;
        };
        files: ProcessOperationGuideFileItem[];
    };
}

export interface PatchProcessOperationOptions {
    exit?: number | null;
    description?: string;
    files?: File[];
    removedFileIds?: number[];
}

export type GetProcessOperationsTableFilters = {
    processId: number;
    operationGroupId: number;
};
