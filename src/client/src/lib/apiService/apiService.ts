import axios, {AxiosError} from "axios";
import {AuthService} from "@/lib/apiService/authService/authService";
import {useSnackbarStore} from "@/store/snackbar/snackbar";
import {ApiServiceErrorOptions, ApiServiceResponse} from "@/lib/apiService/types";

export const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/",
    withCredentials: true,
});

export const ApiService = {
    auth: AuthService,
};

export const handleApiError = <T>(
    e: AxiosError<{message?: string}>,
    errorOptions?: ApiServiceErrorOptions,
): ApiServiceResponse<T> => {
    if (axios.isCancel(e) || e?.name === 'CanceledError') {
        return {
            status: 'error',
            data: 'canceled'
        }
    }

    if (e.response) {
        const message = e?.response?.data?.message || errorOptions?.placeholder || 'Неизвестная ошибка';

        if (errorOptions?.show !== false) {
            useSnackbarStore.getState().addSnackbar({
                type: 'error',
                text: message,
            });
        }

        return {
            status: 'error',
            data: message
        }
    }

    return {
        status: 'error',
        data: errorOptions?.placeholder || 'Неизвестная ошибка'
    }
};

export const handleApiSuccess = <T>(
    data: T,
    condition: boolean,
    placeholderError?: string,
): ApiServiceResponse<T> => {
    if (condition) {
        return { status: 'success', data };
    }
    return {
        status: 'error',
        data: placeholderError || 'Неизвестная ошибка',
    };
};
