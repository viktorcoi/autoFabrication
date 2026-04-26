import {create} from "zustand";
import {ShowErrorsStore, ShowErrorType} from "@/store/showErrors/types";
import {DeleteUsersResponse} from "@/apiService/apiUsers/types";

export const useShowErrors = create<ShowErrorsStore>((set) => ({
    render: false,
    show: false,
    data: [],

    open: (data: { id: number, name: string }[], result: DeleteUsersResponse) => {
        const namesById = new Map(data.map((item) => [item.id, item.name]));
        const resultEntries: Array<[number, Omit<ShowErrorType, 'name'>]> = [
            ...result.success.map((item): [number, Omit<ShowErrorType, 'name'>] => [
                item.id,
                {
                    id: item.id,
                    status: 'success' as const,
                    description: item.description,
                },
            ]),
            ...result.error.map((item): [number, Omit<ShowErrorType, 'name'>] => [
                item.id,
                {
                    id: item.id,
                    status: 'error' as const,
                    description: item.description,
                },
            ]),
        ];
        const resultById = new Map<number, Omit<ShowErrorType, 'name'>>(resultEntries);
        const usedIds = new Set<number>();
        const preparedData: ShowErrorType[] = data.flatMap((item) => {
            const resultItem = resultById.get(item.id);

            if (!resultItem) {
                return [];
            }

            usedIds.add(item.id);

            return [{
                ...resultItem,
                name: item.name,
            }];
        });
        const extraResultData: ShowErrorType[] = [...resultById.values()]
            .filter((item) => !usedIds.has(item.id))
            .map((item) => ({
                ...item,
                name: namesById.get(item.id) ?? `#${item.id}`,
            }));

        set({
            data: [...preparedData, ...extraResultData],
            render: true,
            show: true,
        });
    },

    onClose: () => {
        set({show: false});
    },

    onClosed: () => {
        set({
            show: false,
            render: false,
            data: []
        });
    }
}));
