import {TableRow} from "@/components/Table/types";

export interface GetByIdTypeProductsResponse {
    id: number;
    name: string;
    description?: string;
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
    description?: string;
}

export type PatchTypeProductsTableOptions = Record<number, Partial<Omit<TypeProductsTableRow, "id">>>;
