import React from "react";
import {ModalPageProps} from "@vkontakte/vkui";
import {ModalPageCloseReasonType} from "@/components/modals/types";

export interface ModalManageMaterialProps extends Omit<ModalPageProps, 'onClose'> {
    idMaterial: number | null;
    onClose(reason: ModalPageCloseReasonType, event?:  React.UIEvent<HTMLElement>): void;
    updateData?(): void;
}
