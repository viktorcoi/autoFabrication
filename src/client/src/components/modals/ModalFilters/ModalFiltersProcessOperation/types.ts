import {ModalPageProps} from "@vkontakte/vkui";
import {GetProcessOperationsTableFilters} from "@/apiService/apiProcessOperations/types";
import {ModalPageCloseReasonType} from "@/components/modals/types";

export interface ModalFiltersProcessOperationProps extends Omit<ModalPageProps, "children" | "onClose"> {
    data: Omit<GetProcessOperationsTableFilters, "processId">;
    onChangeFilters(data: Omit<GetProcessOperationsTableFilters, "processId">): void;
    onClose?(reason: ModalPageCloseReasonType, event?: unknown): void;
}
