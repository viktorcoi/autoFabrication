import {DeleteUsersResponse} from "@/apiService/apiUsers/types";

export type ShowErrorType = {
    id: number;
    status: 'success' | 'error';
    name: string;
    description: string;
}

export type ShowErrorsStore = {
    data: ShowErrorType[];
    render: boolean;
    show: boolean;

    open(data: { id: number, name: string }[], result: DeleteUsersResponse): void;
    onClose(): void;
    onClosed(): void;
};
