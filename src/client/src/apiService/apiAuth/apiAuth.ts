import {api, handleApiError, handleApiSuccess} from "@/apiService/apiService";
import {ApiServiceOptions, ApiServiceResponse} from "@/apiService/types";
import {GetAuthMeResponse} from "@/apiService/apiAuth/types";

export const ApiAuth = {
    login: async (options: ApiServiceOptions<{
        login: string;
        password: string;
    }>): Promise<ApiServiceResponse<GetAuthMeResponse>> => {
        return await api.post("/auth/login",
            {
                login: options.login,
                password: options.password,
            },
            { signal: options.controller?.signal }
        ).then(r => {
            return handleApiSuccess(
                r.data,
                r.status === 200 && r.data,
                options.errorOptions?.placeholder
            );
        }).catch((e) => handleApiError(e, options.errorOptions, 'auth'));
    },

    me: async (options: ApiServiceOptions): Promise<ApiServiceResponse<GetAuthMeResponse>> => {
        return await api.get("/auth/me", {
            signal: options.controller?.signal
        }).then(r => {
            return handleApiSuccess(
                r.data,
                r.status === 200 && r.data,
                options.errorOptions?.placeholder
            );
        }).catch((e) => handleApiError(e, options.errorOptions, 'me'));
    },

    logout: async (options: ApiServiceOptions): Promise<ApiServiceResponse<{}>> => {
        return await api.post("/auth/logout",
            {},
            { signal: options.controller?.signal }
        ).then(r => {
            return handleApiSuccess(
                r.data,
                r.status === 204,
                options.errorOptions?.placeholder
            );
        }).catch((e) => handleApiError(e, options.errorOptions));
    },
};
