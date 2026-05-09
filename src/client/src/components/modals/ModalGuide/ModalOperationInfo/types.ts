import React from "react";
import {ModalPageProps} from "@vkontakte/vkui";
import {ModalPageCloseReasonType} from "@/components/modals/types";

export interface ModalOperationInfoProps extends Omit<ModalPageProps, "children" | "onClose"> {
    operationId: number;
    onClose(reason: ModalPageCloseReasonType, event?: React.UIEvent<HTMLElement>): void;
}
