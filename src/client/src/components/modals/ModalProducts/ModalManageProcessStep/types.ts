import React from "react";
import {ModalPageProps} from "@vkontakte/vkui";
import {ProcessStepFormItem} from "@/apiService/apiProcessSteps/types";
import {ModalPageCloseReasonType} from "@/components/modals/types";

export interface ModalManageProcessStepProps extends Omit<ModalPageProps, "children" | "onClose"> {
    idStep?: number | null;
    step?: ProcessStepFormItem | null;
    onApplyStep?(step: ProcessStepFormItem): void;
    onClose(reason: ModalPageCloseReasonType, event?: React.UIEvent<HTMLElement>): void;
}
