import {TableRow} from "@/components/Table/types";

export interface ProductsTableRow extends TableRow {
    id: number;
    name: string;
    typeProduct: string;
    material: string;
    creator: string;
    createdAt: string;
}

export type PatchProductsTableOptions = Record<number, Partial<Pick<ProductsTableRow, "name">>>;

export type GetProductsTableFilters = {
    typeProductId: number;
    materialId: number;
    creatorId: number;
    createdAt: Date | null;
};
