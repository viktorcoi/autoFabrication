import {ModalPageProps} from "@vkontakte/vkui";
import {ModalPageCloseReasonType} from "@/components/modals/types";
import React from "react";

export interface ModalChangePasswordProps extends Omit<ModalPageProps, 'onClose'> {
    userId: number;
    name: string;
    onClose(reason: ModalPageCloseReasonType, event?:  React.UIEvent<HTMLElement>): void;
    onLoading(v: boolean): void;
}
