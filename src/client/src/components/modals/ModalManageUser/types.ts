import React from "react";
import {ModalPageProps} from "@vkontakte/vkui";
import {ModalPageCloseReasonType} from "@/components/modals/types";
import {PostUserOptions} from "@/apiService/apiUsers/types";

export interface PostUserType extends Omit<PostUserOptions,
    'birthDate' | 'avatarUrl' | 'login' | 'password'
> {
    birthDate: Date | null;
    avatarUrl?: string | File | null;
}

export interface ModalManageUserProps extends Omit<ModalPageProps, 'onClose'> {
    idUser: number | null;
    user: null | PostUserOptions;
    onCreate(modal: 'modal-create-user', data: PostUserOptions): void;
    onClose(reason: ModalPageCloseReasonType, event?:  React.UIEvent<HTMLElement>): void;
}
