import React from "react";
import {ModalPageCloseReason, ModalPageProps} from "@vkontakte/vkui";

export interface ModalManageRoleProps extends Omit<ModalPageProps, 'onClose'> {
    idRole: number | null;
    onClose(reason: ModalPageCloseReason | 'updated-data' | 'cancel', event?:  React.UIEvent<HTMLElement>): void;
    onLoading(v: boolean): void;
}
