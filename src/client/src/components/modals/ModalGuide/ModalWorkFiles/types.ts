import React from "react";
import {ModalPageProps} from "@vkontakte/vkui";
import {WorkFileItem} from "@/apiService/apiGuide/types";
import {ModalPageCloseReasonType} from "@/components/modals/types";

export interface ModalWorkFilesProps extends Omit<ModalPageProps, 'onClose'> {
    workId: number;
    workName: string;
    files: WorkFileItem[];
    onClose(reason: ModalPageCloseReasonType, event?: React.UIEvent<HTMLElement>): void;
}
