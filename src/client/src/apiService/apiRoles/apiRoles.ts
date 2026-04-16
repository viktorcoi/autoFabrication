import {ApiServiceOptions, ApiServiceResponse} from "@/apiService/types";
import {api, handleApiError, handleApiSuccess} from "@/apiService/apiService";
import {GetByIdRoleResponse, GetRolesResponse, PostRolesOptions} from "@/apiService/apiRoles/types";

export const ApiRoles = {
    get: async (options: ApiServiceOptions): Promise<ApiServiceResponse<GetRolesResponse[]>> => {
        return await api.get("/roles", {
            signal: options.controller?.signal
        }).then(r => {
            return handleApiSuccess(
                r.data,
                r.status === 200 && Array.isArray(r.data),
                options.errorOptions?.placeholder
            );
        }).catch((e) => handleApiError(e, options.errorOptions));
    },

    post: async (options: ApiServiceOptions<{
        options: PostRolesOptions;
    }>): Promise<ApiServiceResponse<GetByIdRoleResponse>> => {
        return await api.post("/roles",
            {...options.options},
            { signal: options.controller?.signal }
        ).then(r => {
            return handleApiSuccess(
                r.data,
                r.status === 201 && r.data,
                options.errorOptions?.placeholder
            );
        }).catch((e) => handleApiError(e, options.errorOptions));;
    }
}
