import {ModalCardProps} from "@vkontakte/vkui";
import React from "react";
import {ModalPageCloseReasonType} from "@/components/modals/types";

export interface ModalMultiRemoveProps extends Omit<ModalCardProps, 'onClose'> {
    data: { id: number, name: string }[];
    url: '/users' | '/typeProducts' | '/materialGroup' | '/operationGroup' | '/material' | '/operation';
    onClose(reason: ModalPageCloseReasonType, event?:  React.UIEvent<HTMLElement>): void;
    onLoading(v: boolean): void;
}
