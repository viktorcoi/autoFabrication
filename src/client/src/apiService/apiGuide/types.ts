import {TableRow} from "@/components/Table/types";

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
