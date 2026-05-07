import React from "react";
import {ModalPageProps} from "@vkontakte/vkui";
import {ModalPageCloseReasonType} from "@/components/modals/types";
import {ProductImageItem} from "@/apiService/apiProducts/types";

export interface ModalProductEditImagesProps extends Omit<ModalPageProps, "children" | "onClose"> {
    existingImages: ProductImageItem[];
    images: File[];
    onChangeImages(data: {
        existingImages: ProductImageItem[];
        images: File[];
    }): void;
    onClose(reason: ModalPageCloseReasonType, event?: React.UIEvent<HTMLElement>): void;
}
