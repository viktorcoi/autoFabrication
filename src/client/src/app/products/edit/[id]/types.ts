import {ProductFileItem, ProductImageItem, RelatedProductFormItem} from "@/apiService/apiProducts/types";

export type ProductEditFormData = {
    name: string;
    typeProductId: number;
    materialId: number;
    description: string;
    files: File[];
    existingFiles: ProductFileItem[];
    images: File[];
    existingImages: ProductImageItem[];
    relatedProducts: RelatedProductFormItem[];
};

export type ProductImageListItem = {
    type: 'existing';
    key: string;
    image: ProductImageItem;
} | {
    type: 'new';
    key: string;
    image: File;
};
