import React from "react";
import {ModalPageProps} from "@vkontakte/vkui";
import {ModalPageCloseReasonType} from "@/components/modals/types";
import {RelatedProductFormItem} from "@/apiService/apiProducts/types";

export interface ModalRelatedProductsProps extends Omit<ModalPageProps, "children" | "onClose"> {
    selectedProducts: RelatedProductFormItem[];
    onChangeProducts(products: RelatedProductFormItem[]): void;
    onClose(reason: ModalPageCloseReasonType, event?: React.UIEvent<HTMLElement>): void;
}
