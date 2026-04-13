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
