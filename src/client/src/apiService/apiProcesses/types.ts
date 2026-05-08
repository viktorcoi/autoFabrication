import {TableRow} from "@/components/Table/types";

export interface ProcessFileItem {
    id: number;
    name: string;
    size: number;
}

export interface GetByIdProcessResponse {
    id: number;
    productId: number;
    name: string;
    description?: string | null;
    blankId: number | null;
    creatorId: number;
    disabledById: number | null;
    createdAt: string;
    updatedAt: string;
    product: {
        id: number;
        name: string;
        materialId: number | null;
        material: {
            id: number;
            name: string;
        } | null;
    };
    blank: {
        id: number;
        name: string;
        description?: string | null;
        materialId: number;
    } | null;
    creator: {
        id: number;
        firstName: string;
        lastName: string;
        middleName?: string | null;
        login: string;
        fullName: string;
    };
    disabledBy: {
        id: number;
        firstName: string;
        lastName: string;
        middleName?: string | null;
        login: string;
        fullName: string;
    } | null;
    files: ProcessFileItem[];
    access: boolean;
}

export interface PostProcessOptions {
    productId: number;
    name: string;
    description?: string;
    blankId?: number | null;
    files?: File[];
}

export interface PathProcessOptions {
    name?: string;
    description?: string;
    blankId?: number | null;
    files?: File[];
    removedFileIds?: number[];
}

export interface ProcessTableRow extends TableRow {
    id: number;
    name: string;
    creator: string;
    blank: string;
    files: ProcessFileItem[];
    filesDownload: string;
    operationCount: number | "";
    access: boolean;
    accessTooltip: string;
    canChangeAccess: boolean;
    canEdit: boolean;
    isLocked: boolean;
    description: string;
}

export type PatchProcessTableOptions = Record<number, Partial<Pick<ProcessTableRow, "name" | "description">>>;

export type GetProcessTableFilters = {
    productId: number;
};
