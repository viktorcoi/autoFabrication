import {ApiServiceOptions, ApiServiceResponse} from "@/apiService/types";
import {api, handleApiError, handleApiSuccess} from "@/apiService/apiService";
import {GetRolesResponse} from "@/apiService/apiRoles/types";

export const ApiRoles = {
    get: async (options: ApiServiceOptions): Promise<ApiServiceResponse<GetRolesResponse[]>> => {
        return await api.get("/roles").then(r => {
            return handleApiSuccess(
                r.data,
                r.status === 200 && Array.isArray(r.data),
                options.errorOptions?.placeholder
            );
        }).catch((e: any) => handleApiError(e, options.errorOptions));
    },
}
