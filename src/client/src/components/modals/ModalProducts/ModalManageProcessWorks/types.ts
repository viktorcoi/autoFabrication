import React from "react";
import {ModalPageProps} from "@vkontakte/vkui";
import {ModalPageCloseReasonType} from "@/components/modals/types";

export interface ModalManageProcessWorksProps extends Omit<ModalPageProps, "children" | "onClose"> {
    stepId: number;
    operationId: number;
    disabled?: boolean;
    onClose(reason: ModalPageCloseReasonType, event?: React.UIEvent<HTMLElement>): void;
}
