import React from "react";
import {ModalPageProps} from "@vkontakte/vkui";
import {ModalPageCloseReasonType} from "@/components/modals/types";

export interface ModalManageProcessWorkProps extends Omit<ModalPageProps, "children" | "onClose"> {
    idProcessWork: number;
    onClose(reason: ModalPageCloseReasonType, event?: React.UIEvent<HTMLElement>): void;
}
