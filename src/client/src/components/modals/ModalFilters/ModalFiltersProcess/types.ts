import {ModalPageProps} from "@vkontakte/vkui";
import {GetProcessTableFilters} from "@/apiService/apiProcesses/types";
import {ModalPageCloseReasonType} from "@/components/modals/types";

export interface ModalFiltersProcessProps extends Omit<ModalPageProps, "children" | "onClose"> {
    data: Omit<GetProcessTableFilters, "productId">;
    productMaterialId: number | null;
    onChangeFilters(data: Omit<GetProcessTableFilters, "productId">): void;
    onClose?(reason: ModalPageCloseReasonType, event?: unknown): void;
}
