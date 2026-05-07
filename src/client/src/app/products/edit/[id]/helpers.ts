import {GetByIdProductResponse, RelatedProductFormItem} from "@/apiService/apiProducts/types";
import {ProductEditFormData, ProductImageListItem} from "@/app/products/edit/[id]/types";

export const getProductItemIds = <T extends {id: number}>(items: T[]) => items.map((item) => item.id).sort((a, b) => a - b);
export const getProductOrderedItemIds = <T extends {id: number}>(items: T[]) => items.map((item) => item.id);

export const getRelatedProductsSignature = (products: RelatedProductFormItem[]) => JSON.stringify(
    products
        .map(({id, count}) => ({id, count}))
        .sort((a, b) => a.id - b.id)
);

export const getProductImageItems = (data: Pick<ProductEditFormData, 'existingImages' | 'images'>): ProductImageListItem[] => [
    ...data.existingImages.map((image) => ({
        type: 'existing' as const,
        key: `existing-${image.id}`,
        image,
    })),
    ...data.images.map((image, index) => ({
        type: 'new' as const,
        key: `new-${image.name}-${image.type}-${image.size}-${image.lastModified}-${index}`,
        image,
    })),
];

export const getProductFormData = (product: GetByIdProductResponse): ProductEditFormData => ({
    name: product.name,
    typeProductId: product.typeProductId,
    materialId: product.materialId ?? 0,
    description: product.description ?? '',
    files: [],
    existingFiles: product.files,
    images: [],
    existingImages: product.images,
    relatedProducts: product.relatedProducts.map(({count, product}) => ({
        id: product.id,
        name: product.name,
        count,
    })),
});
