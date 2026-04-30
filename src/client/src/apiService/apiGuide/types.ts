import {TableRow} from "@/components/Table/types";

export interface GetMaterialGroupsResponse {
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

export type PatchMaterialTableOptions = Record<number, Partial<Pick<MaterialTableRow, "name" | "description">>>;

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

export type PatchOperationTableOptions = Record<number, Partial<Pick<OperationTableRow, "name" | "description">>>;
