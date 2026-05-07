import {ModalPageProps} from "@vkontakte/vkui";
import {GetProductsTableFilters} from "@/apiService/apiProducts/types";
import {ModalPageCloseReasonType} from "@/components/modals/types";

export interface ModalFiltersProductsProps extends Omit<ModalPageProps, "children" | "onClose"> {
    data: GetProductsTableFilters;
    onChangeFilters(data: GetProductsTableFilters): void;
    onClose?(reason: ModalPageCloseReasonType, event?: unknown): void;
}
