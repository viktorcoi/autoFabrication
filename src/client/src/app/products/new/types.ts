import {RelatedProductFormItem} from "@/apiService/apiProducts/types";

export type ProductNewFormData = {
    name: string;
    typeProductId: number;
    materialId: number;
    description: string;
    files: File[];
    images: File[];
    relatedProducts: RelatedProductFormItem[];
};
