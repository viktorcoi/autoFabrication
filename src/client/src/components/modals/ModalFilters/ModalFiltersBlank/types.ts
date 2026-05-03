import {ModalPageProps} from "@vkontakte/vkui";
import {ModalPageCloseReasonType} from "@/components/modals/types";
import React from "react";
import {GetBlanksTableFilters} from "@/apiService/apiGuide/types";

export interface ModalFiltersBlankProps extends Omit<ModalPageProps, 'onClose'> {
    data: GetBlanksTableFilters;
    onClose(reason: ModalPageCloseReasonType, event?:  React.UIEvent<HTMLElement>): void;
    onChangeFilters(filters: GetBlanksTableFilters): void;
}
