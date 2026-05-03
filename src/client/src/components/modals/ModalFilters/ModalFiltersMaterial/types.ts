import {ModalPageProps} from "@vkontakte/vkui";
import {ModalPageCloseReasonType} from "@/components/modals/types";
import React from "react";
import {GetMaterialsTableFilters} from "@/apiService/apiGuide/types";

export interface ModalFiltersMaterialProps extends Omit<ModalPageProps, 'onClose'> {
    data: GetMaterialsTableFilters;
    onClose(reason: ModalPageCloseReasonType, event?:  React.UIEvent<HTMLElement>): void;
    onChangeFilters(filters: GetMaterialsTableFilters): void;
}
