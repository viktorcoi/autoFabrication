import {ModalPageProps} from "@vkontakte/vkui";
import {PostUserOptions} from "@/apiService/apiUsers/types";
import {ModalPageCloseReasonType} from "@/components/modals/types";
import React from "react";

export interface ModalCreateUserProps extends Omit<ModalPageProps, 'onClose'> {
    user: PostUserOptions;
    onBack(modal: 'modal-manage-user'): void;
    onClose(reason: ModalPageCloseReasonType, event?:  React.UIEvent<HTMLElement>): void;
}
