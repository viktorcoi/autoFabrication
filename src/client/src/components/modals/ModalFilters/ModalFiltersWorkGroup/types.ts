import {ModalPageProps} from "@vkontakte/vkui";
import {ModalPageCloseReasonType} from "@/components/modals/types";
import React from "react";
import {GetWorkGroupsTableFilters} from "@/apiService/apiGuide/types";

export interface ModalFiltersWorkGroupProps extends Omit<ModalPageProps, 'onClose'> {
    data: GetWorkGroupsTableFilters;
    onClose(reason: ModalPageCloseReasonType, event?:  React.UIEvent<HTMLElement>): void;
    onChangeFilters(filters: GetWorkGroupsTableFilters): void;
}
