import {ModalPageProps} from "@vkontakte/vkui";
import {ModalPageCloseReasonType} from "@/components/modals/types";
import React from "react";

export interface ModalShowErrorsProps extends Omit<ModalPageProps, 'onClose'> {
    onClose(reason: ModalPageCloseReasonType, event?:  React.UIEvent<HTMLElement>): void;
}
