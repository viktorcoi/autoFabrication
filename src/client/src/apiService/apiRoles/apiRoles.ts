import {ApiServiceOptions, ApiServiceResponse} from "@/apiService/types";
import {api, handleApiError, handleApiSuccess} from "@/apiService/apiService";
import {
    GetByIdRoleResponse,
    GetRolesOptions,
    GetRolesResponse,
    PatchRolePermissionsOptions,
    PostRolesOptions
} from "@/apiService/apiRoles/types";

export const ApiRoles = {
    getById: async (options: ApiServiceOptions<{
        id: number
    }>): Promise<ApiServiceResponse<GetByIdRoleResponse>> => {
        return await api.get(`/roles/${options.id}`, {
            signal: options.controller?.signal
        }).then(r => {
            return handleApiSuccess(
                r.data,
                r.status === 200 && r.data,
                options.errorOptions?.placeholder
            );
        }).catch((e) => handleApiError(e, options.errorOptions));
    },

    get: async (options: ApiServiceOptions<{
        options?: GetRolesOptions,
    }>): Promise<ApiServiceResponse<GetRolesResponse[]>> => {
        return await api.get("/roles", {
            signal: options.controller?.signal,
            params: {...options.options}
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
        }).catch((e) => handleApiError(e, options.errorOptions));
    },

    patch: async (options: ApiServiceOptions<{
        id: number,
        options: PostRolesOptions;
    }>): Promise<ApiServiceResponse<GetByIdRoleResponse>> => {
        return await api.patch(`/roles/${options.id}`,
            {...options.options},
            { signal: options.controller?.signal }
        ).then(r => {
            return handleApiSuccess(
                r.data,
                r.status === 200 && r.data,
                options.errorOptions?.placeholder
            );
        }).catch((e) => handleApiError(e, options.errorOptions));
    },

    permissions: {
        patch: async (options: ApiServiceOptions<{
            id: number,
            options: PatchRolePermissionsOptions;
        }>): Promise<ApiServiceResponse<GetByIdRoleResponse>> => {
            return await api.patch(`/roles/${options.id}/permissions`,
                {...options.options},
                { signal: options.controller?.signal }
            ).then(r => {
                return handleApiSuccess(
                    r.data,
                    r.status === 200 && r.data,
                    options.errorOptions?.placeholder
                );
            }).catch((e) => handleApiError(e, options.errorOptions));
        },
    },

    delete: async (options: ApiServiceOptions<{
        id: number,
    }>): Promise<ApiServiceResponse<void>> => {
        return await api.delete(`/roles/${options.id}`,
            { signal: options.controller?.signal }
        ).then(r => {
            return handleApiSuccess(
                r.data,
                r.status === 204,
                options.errorOptions?.placeholder
            );
        }).catch((e) => handleApiError(e, options.errorOptions));
    },
}
