import {ModalCardProps} from "@vkontakte/vkui";
import React from "react";
import {ModalPageCloseReasonType} from "@/components/modals/types";

export interface ModalManageRoleProps extends Omit<ModalCardProps, 'onClose'> {
    removeId: number;
    name: string;
    url: '/roles' | '/users' | '/typeProducts' | '/materialGroup' | '/operationGroup' | '/material';
    mode: 'list' | 'table';
    onClose(reason: ModalPageCloseReasonType, event?:  React.UIEvent<HTMLElement>): void;
    onLoading(v: boolean): void;
}
