import {ModalPageProps} from "@vkontakte/vkui";
import {ModalPageCloseReasonType} from "@/components/modals/types";
import React from "react";
import {GetWorksTableFilters} from "@/apiService/apiGuide/types";

export interface ModalFiltersWorksProps extends Omit<ModalPageProps, 'onClose'> {
    data: GetWorksTableFilters;
    onClose(reason: ModalPageCloseReasonType, event?:  React.UIEvent<HTMLElement>): void;
    onChangeFilters(filters: GetWorksTableFilters): void;
}
