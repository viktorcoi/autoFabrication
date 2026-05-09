import {ModalPageProps} from "@vkontakte/vkui";
import {ModalPageCloseReasonType} from "@/components/modals/types";
import {GetProcessWorksTableFilters} from "@/apiService/apiProcessWorks/types";

export interface ModalFiltersProcessWorkProps extends Omit<ModalPageProps, "children" | "onClose"> {
    operationId: number;
    data: Omit<GetProcessWorksTableFilters, "stepId">;
    onChangeFilters(data: Omit<GetProcessWorksTableFilters, "stepId">): void;
    onClose?(reason: ModalPageCloseReasonType, event?: unknown): void;
}
