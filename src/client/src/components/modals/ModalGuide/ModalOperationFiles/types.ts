import React from "react";
import {ModalPageProps} from "@vkontakte/vkui";
import {OperationFileItem} from "@/apiService/apiGuide/types";
import {ModalPageCloseReasonType} from "@/components/modals/types";

export interface ModalOperationFilesProps extends Omit<ModalPageProps, 'onClose'> {
    operationId: number;
    operationName: string;
    files: OperationFileItem[];
    onClose(reason: ModalPageCloseReasonType, event?: React.UIEvent<HTMLElement>): void;
}
