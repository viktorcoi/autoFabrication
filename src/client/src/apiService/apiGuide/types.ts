import {TableRow} from "@/components/Table/types";

export interface GetMaterialGroupsResponse {
    id: number;
    name: string;
}

export interface GetTypeProductsResponse {
    id: number;
    name: string;
}

export interface GetMaterialsResponse {
    id: number;
    name: string;
}

export interface GetBlanksResponse {
    id: number;
    name: string;
}

export interface GetByIdTypeProductsResponse {
    id: number;
    name: string;
    description: string;
    createdAt: string;
    updatedAt: string;
}

export interface PostTypeProductsOptions {
    name: string;
    description: string;
}

export interface PathTypeProductsOptions {
    name: string;
    description: string;
}

export interface TypeProductsTableRow extends TableRow {
    id: number;
    name: string;
    description: string;
}

export type PatchTypeProductsTableOptions = Record<number, Partial<Omit<TypeProductsTableRow, "id">>>;

export interface GetByIdMaterialGroupResponse {
    id: number;
    name: string;
    description: string;
    createdAt: string;
    updatedAt: string;
}

export interface PostMaterialGroupOptions {
    name: string;
    description: string;
}

export interface PathMaterialGroupOptions {
    name: string;
    description: string;
}

export interface MaterialGroupTableRow extends TableRow {
    id: number;
    name: string;
    description: string;
}

export type PatchMaterialGroupTableOptions = Record<number, Partial<Omit<MaterialGroupTableRow, "id">>>;

export interface GetByIdOperationGroupResponse {
    id: number;
    name: string;
    description: string;
    createdAt: string;
    updatedAt: string;
}

export interface GetOperationGroupsResponse {
    id: number;
    name: string;
}

export interface GetOperationsResponse {
    id: number;
    name: string;
}

export interface GetWorkGroupsResponse {
    id: number;
    name: string;
}

export interface PostOperationGroupOptions {
    name: string;
    description: string;
}

export interface PathOperationGroupOptions {
    name: string;
    description: string;
}

export interface OperationGroupTableRow extends TableRow {
    id: number;
    name: string;
    description: string;
}

export type PatchOperationGroupTableOptions = Record<number, Partial<Omit<OperationGroupTableRow, "id">>>;

export interface GetByIdMaterialResponse {
    id: number;
    name: string;
    description: string;
    materialGroupId: number;
    createdAt: string;
    updatedAt: string;
    materialGroup: {
        id: number;
        name: string;
        description: string;
    };
}

export interface PostMaterialOptions {
    name: string;
    description: string;
    materialGroupId: number;
}

export interface PathMaterialOptions {
    name: string;
    description: string;
    materialGroupId: number;
}

export interface MaterialTableRow extends TableRow {
    id: number;
    name: string;
    description: string;
    materialGroup: string;
}

export type GetMaterialsTableFilters = {
    materialGroupId: number;
};

export type PatchMaterialTableOptions = Record<number, Partial<Pick<MaterialTableRow, "name" | "description">>>;

export interface GetByIdBlankResponse {
    id: number;
    name: string;
    description: string;
    materialId: number;
    createdAt: string;
    updatedAt: string;
    material: {
        id: number;
        name: string;
        description: string;
        materialGroupId: number;
        materialGroup: {
            id: number;
            name: string;
            description: string;
        };
    };
}

export interface PostBlankOptions {
    name: string;
    description: string;
    materialId: number;
}

export interface PathBlankOptions {
    name: string;
    description: string;
    materialId: number;
}

export interface BlankTableRow extends TableRow {
    id: number;
    name: string;
    description: string;
    material: string;
    materialGroup: string;
}

export type GetBlanksTableFilters = {
    materialGroupId: number;
    materialId: number;
};

export type PatchBlankTableOptions = Record<number, Partial<Pick<BlankTableRow, "name" | "description">>>;

export interface GetByIdWorkGroupResponse {
    id: number;
    name: string;
    description: string;
    operationId: number;
    createdAt: string;
    updatedAt: string;
    operation: {
        id: number;
        name: string;
        description: string;
        operationGroupId: number;
        operationGroup: {
            id: number;
            name: string;
            description: string;
        };
    };
}

export interface PostWorkGroupOptions {
    name: string;
    description: string;
    operationId: number;
}

export interface PathWorkGroupOptions {
    name: string;
    description: string;
    operationId: number;
}

export interface WorkGroupTableRow extends TableRow {
    id: number;
    name: string;
    description: string;
    operation: string;
    operationGroup: string;
}

export type PatchWorkGroupTableOptions = Record<number, Partial<Pick<WorkGroupTableRow, "name" | "description">>>;

export type GetWorkGroupsTableFilters = {
    operationGroupId: number;
    operationId: number;
};

export interface OperationFileItem {
    id: number;
    name: string;
    size: number;
}

export interface GetByIdOperationResponse {
    id: number;
    name: string;
    description: string;
    operationGroupId: number;
    createdAt: string;
    updatedAt: string;
    operationGroup: {
        id: number;
        name: string;
        description: string;
    };
    files: OperationFileItem[];
}

export interface PostOperationOptions {
    name: string;
    description: string;
    operationGroupId: number;
    files: File[];
}

export interface PathOperationOptions {
    name?: string;
    description?: string;
    operationGroupId?: number;
    files?: File[];
    removedFileIds?: number[];
}

export interface OperationTableRow extends TableRow {
    id: number;
    name: string;
    description: string;
    operationGroup: string;
    download: string;
    files: OperationFileItem[];
}

export type GetOperationsTableFilters = {
    operationGroupId: number;
};

export type PatchOperationTableOptions = Record<number, Partial<Pick<OperationTableRow, "name" | "description">>>;

export interface WorkFileItem {
    id: number;
    name: string;
    size: number;
}

export interface GetByIdWorkResponse {
    id: number;
    name: string;
    description: string;
    workGroupId: number;
    tpz: number;
    tsht: number;
    createdAt: string;
    updatedAt: string;
    workGroup: {
        id: number;
        name: string;
        description: string;
        operationId: number;
        operation: {
            id: number;
            name: string;
            description: string;
            operationGroupId: number;
            operationGroup: {
                id: number;
                name: string;
                description: string;
            };
        };
    };
    files: WorkFileItem[];
}

export interface PostWorkOptions {
    name: string;
    description: string;
    workGroupId: number;
    tpz: number;
    tsht: number;
    files: File[];
}

export interface PathWorkOptions {
    name?: string;
    description?: string;
    workGroupId?: number;
    tpz?: number;
    tsht?: number;
    files?: File[];
    removedFileIds?: number[];
}

export interface WorkTableRow extends TableRow {
    id: number;
    name: string;
    workGroup: string;
    operation: string;
    operationGroup: string;
    tpz: number;
    tsht: number;
    download: string;
    description: string;
    files: WorkFileItem[];
}

export type PatchWorkTableOptions = Record<number, Partial<Pick<WorkTableRow, "name" | "tpz" | "tsht" | "description">>>;

export type GetWorksTableFilters = {
    operationGroupId: number;
    operationId: number;
    workGroupId: number;
};
