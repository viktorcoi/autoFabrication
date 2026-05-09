import {TableRow} from "@/components/Table/types";

export interface ProcessWorkTableRow extends TableRow {
    id: number;
    index: number;
    name: string;
    tpz: number | "";
    tsht: number | "";
    count: number;
    workGroup: string;
    description: string;
    workId: number;
    workGroupId: number;
    canEdit: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface ProcessWorkSelectedItem {
    id: number;
    workId: number;
    name: string;
    workGroup: string;
    workGroupId: number;
    sortOrder: number;
    count: number;
    tpz: number;
    tsht: number;
}

export interface GetByIdProcessWorkResponse {
    id: number;
    processStepId: number;
    workId: number;
    sortOrder: number;
    count: number;
    tpz: number;
    tsht: number;
    description: string | null;
    createdAt: string;
    updatedAt: string;
    processStep: {
        id: number;
        name: string;
        sortOrder: number;
        processOperationId: number;
        processOperation: {
            id: number;
            processId: number;
            operationId: number;
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
    };
    work: {
        id: number;
        name: string;
        description: string | null;
        tpz: number;
        tsht: number;
        workGroupId: number;
        workGroup: {
            id: number;
            name: string;
            description: string | null;
            operationId: number;
            operation: {
                id: number;
                name: string;
                operationGroup: {
                    id: number;
                    name: string;
                };
            };
        };
    };
}

export interface PatchProcessWorkOptions {
    tpz?: number;
    tsht?: number;
    count?: number;
    description?: string;
}

export interface PutProcessWorkItem {
    id?: number | null;
    workId: number;
    count: number;
}

export interface PutProcessWorksOptions {
    items: PutProcessWorkItem[];
}

export type GetProcessWorksTableFilters = {
    stepId: number;
    workGroupId: number;
};
