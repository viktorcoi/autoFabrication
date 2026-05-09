import React from "react";
import {ModalPageProps} from "@vkontakte/vkui";
import {ModalPageCloseReasonType} from "@/components/modals/types";

export interface ModalWorkInfoProps extends Omit<ModalPageProps, "children" | "onClose"> {
    workId: number;
    onClose(reason: ModalPageCloseReasonType, event?: React.UIEvent<HTMLElement>): void;
}
