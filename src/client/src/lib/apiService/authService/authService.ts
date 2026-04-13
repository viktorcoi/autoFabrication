import {api, handleApiError, handleApiSuccess} from "@/lib/apiService/apiService";
import {PostAuthLoginResponse, UserInfo} from "@/lib/apiService/authService/types";
import {ApiServiceOptions, ApiServiceResponse} from "@/lib/apiService/types";

export const AuthService = {
    login: async (options: ApiServiceOptions<{
        login: string;
        password: string;
    }>): Promise<ApiServiceResponse<PostAuthLoginResponse>> => {
        return await api.post("/auth/login", {
            login: options.login,
            password: options.password,
        }).then(r => {
            return handleApiSuccess(
                r.data,
                r.status === 200 && r.data,
                options.errorOptions?.placeholder
            );
        }).catch((e: any) => handleApiError(e, options.errorOptions));
    },
    me: async (options: ApiServiceOptions): Promise<ApiServiceResponse<UserInfo>> => {
        return await api.get("/auth/me").then(r => {
            return handleApiSuccess(
                r.data,
                r.status === 200 && r.data,
                options.errorOptions?.placeholder
            );
        }).catch((e: any) => handleApiError(e, options.errorOptions));
    },
    logout: async (options: ApiServiceOptions): Promise<ApiServiceResponse<{}>> => {
        return await api.post("/auth/logout").then(r => {
            return handleApiSuccess(
                r.data,
                r.status === 204,
                options.errorOptions?.placeholder
            );
        }).catch((e: any) => handleApiError(e, options.errorOptions));
    },
};
