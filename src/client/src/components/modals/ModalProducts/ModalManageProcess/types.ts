import React from "react";
import {ModalPageProps} from "@vkontakte/vkui";
import {ModalPageCloseReasonType} from "@/components/modals/types";

export interface ModalManageProcessProps extends Omit<ModalPageProps, "onClose"> {
    idProcess: number | null;
    productId: number;
    productMaterialId: number | null;
    onClose(reason: ModalPageCloseReasonType, event?: React.UIEvent<HTMLElement>): void;
}
