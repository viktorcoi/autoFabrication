import {TableRow} from "@/components/Table/types";

export type ProductsDateRangeFilter = [Date | null, Date | null];

export interface ProductFileItem {
    id: number;
    name: string;
    size: number;
}

export interface ProductImageItem extends ProductFileItem {
    url: string;
}

export interface ProductRelatedItem {
    id: number;
    productId: number;
    count: number;
    product: {
        id: number;
        name: string;
        typeProduct: {
            id: number;
            name: string;
            description?: string | null;
        };
        material: {
            id: number;
            name: string;
            description?: string | null;
        };
    };
}

export interface GetProductsResponse {
    id: number;
    name: string;
    typeProduct: {
        name: string;
    };
    material: {
        name: string;
    };
}

export interface GetByIdProductResponse {
    id: number;
    name: string;
    description?: string | null;
    typeProductId: number;
    materialId: number;
    creatorId: number;
    createdAt: string;
    updatedAt: string;
    typeProduct: {
        id: number;
        name: string;
        description?: string | null;
    };
    material: {
        id: number;
        name: string;
        description?: string | null;
        materialGroupId: number;
        materialGroup: {
            id: number;
            name: string;
            description?: string | null;
        };
    };
    creator: {
        id: number;
        firstName: string;
        lastName: string;
        middleName?: string | null;
        login: string;
        fullName: string;
    };
    files: ProductFileItem[];
    images: ProductImageItem[];
    relatedProducts: ProductRelatedItem[];
}

export interface PostProductOptions {
    name: string;
    description?: string;
    typeProductId: number;
    materialId: number;
    files?: File[];
    images?: File[];
    relatedProducts?: Array<{
        productId: number;
        count: number;
    }>;
}

export interface PathProductOptions {
    name?: string;
    description?: string;
    typeProductId?: number;
    materialId?: number;
    files?: File[];
    images?: File[];
    removedFileIds?: number[];
    removedImageIds?: number[];
    relatedProducts?: Array<{
        productId: number;
        count: number;
    }>;
}

export interface ProductsTableRow extends TableRow {
    id: number;
    name: string;
    description: string;
    typeProduct: string;
    material: string;
    creator: string;
    createdAt: string;
    files: ProductFileItem[];
    filesDownload: string;
    relatedProductsCount: number | "";
}

export type PatchProductsTableOptions = Record<number, Partial<Pick<ProductsTableRow, "name" | "description">>>;

export type GetProductsTableFilters = {
    typeProductId: number;
    materialId: number;
    creatorId: number;
    createdAt: ProductsDateRangeFilter;
};
