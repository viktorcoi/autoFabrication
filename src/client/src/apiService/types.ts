import type {TableSorting} from "@/components/Table/types";

export type ApiServiceErrorOptions = {
    show: boolean;
    placeholder?: string;
}

export type ApiServiceResponse<T> = {
    status: 'success';
    data: T;
} | {
    status: 'error';
    data: string;
};

export type ApiServiceOptions<T extends object = {}> = T & {
    controller?: AbortController;
    errorOptions?: ApiServiceErrorOptions;
};

export interface GetTableResponse <T> {
    data: T;
    total: number;
}

export type GetTableOptions <T extends object = {}> = T & {
    page?: number;
    rows?: number;
    search?: string;
    sorting?: TableSorting;
}

export type GetListOptions <T extends object = {}> = T & {
    search?: string;
    sorting?: TableSorting;
}

type ActionByTableResultItem = {
    id: number;
    description: string;
};

export type ActionByTableResponse = {
    success: ActionByTableResultItem[];
    error: ActionByTableResultItem[];
};
