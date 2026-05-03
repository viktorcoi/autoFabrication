import React from "react";
import {ModalPageProps} from "@vkontakte/vkui";
import {ModalPageCloseReasonType} from "@/components/modals/types";

export interface ModalManageBlankProps extends Omit<ModalPageProps, 'onClose'> {
    idBlank: number | null;
    onClose(reason: ModalPageCloseReasonType, event?:  React.UIEvent<HTMLElement>): void;
    onLoading(v: boolean): void;
}
