import React from "react";
import {ModalPageProps} from "@vkontakte/vkui";
import {ModalPageCloseReasonType} from "@/components/modals/types";

export interface ModalProductImagesProps extends Omit<ModalPageProps, "children" | "onClose"> {
    images: File[];
    onChangeImages(images: File[]): void;
    onClose(reason: ModalPageCloseReasonType, event?: React.UIEvent<HTMLElement>): void;
}
