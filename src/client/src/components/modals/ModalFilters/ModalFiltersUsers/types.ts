import {ModalPageProps} from "@vkontakte/vkui";
import {ModalPageCloseReasonType} from "@/components/modals/types";
import React from "react";
import {GetUsersTableFilters} from "@/apiService/apiUsers/types";

export interface ModalFiltersUsersProps extends Omit<ModalPageProps, 'onClose'> {
    data: GetUsersTableFilters;
    onClose(reason: ModalPageCloseReasonType, event?:  React.UIEvent<HTMLElement>): void;
    onChangeFilters(filters: GetUsersTableFilters): void;
}
