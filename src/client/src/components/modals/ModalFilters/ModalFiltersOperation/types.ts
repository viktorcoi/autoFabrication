import {ModalPageProps} from "@vkontakte/vkui";
import {ModalPageCloseReasonType} from "@/components/modals/types";
import React from "react";
import {GetOperationsTableFilters} from "@/apiService/apiGuide/types";

export interface ModalFiltersOperationProps extends Omit<ModalPageProps, 'onClose'> {
    data: GetOperationsTableFilters;
    onClose(reason: ModalPageCloseReasonType, event?:  React.UIEvent<HTMLElement>): void;
    onChangeFilters(filters: GetOperationsTableFilters): void;
}
