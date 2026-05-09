import React from "react";
import {ModalPageProps} from "@vkontakte/vkui";
import {ModalPageCloseReasonType} from "@/components/modals/types";

export interface ModalManageProcessOperationProps extends Omit<ModalPageProps, "children" | "onClose"> {
    idProcessOperation: number;
    onClose(reason: ModalPageCloseReasonType, event?: React.UIEvent<HTMLElement>): void;
}
