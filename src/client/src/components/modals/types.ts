import {ModalPageCloseReason} from "@vkontakte/vkui";

export type OpenModalsType<T = string> = {
    id: T | null;
    show: boolean;
    data: any;
};

export type ModalPageCloseReasonType = ModalPageCloseReason | 'error' | 'updated-data' | 'cancel';
