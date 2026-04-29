import {
    ActionByTableResponse,
    ApiServiceOptions,
    ApiServiceResponse,
    GetTableOptions,
    GetTableResponse
} from "@/apiService/types";
import {api, buildTableOptions, handleApiError, handleApiSuccess} from "@/apiService/apiService";
import {
    GetByIdMaterialGroupResponse,
    GetByIdOperationGroupResponse,
    GetByIdTypeProductsResponse,
    MaterialGroupTableRow,
    OperationGroupTableRow,
    PatchMaterialGroupTableOptions,
    PatchOperationGroupTableOptions,
    PatchTypeProductsTableOptions,
    PathMaterialGroupOptions,
    PathOperationGroupOptions,
    PathTypeProductsOptions,
    PostMaterialGroupOptions,
    PostOperationGroupOptions,
    PostTypeProductsOptions,
    TypeProductsTableRow
} from "@/apiService/apiGuide/types";

export const ApiGuide = {
    materialGroup: {
        getById: async (options: ApiServiceOptions<{
            id: number
        }>): Promise<ApiServiceResponse<GetByIdMaterialGroupResponse>> => {
            return await api.get(`/guide/materialGroup/${options.id}`, {
                signal: options.controller?.signal
            }).then(r => {
                return handleApiSuccess(
                    r.data,
                    r.status === 200 && r.data,
                    options.errorOptions?.placeholder
                );
            }).catch((e) => handleApiError(e, options.errorOptions));
        },

        post: async (options: ApiServiceOptions<{
            options: PostMaterialGroupOptions;
        }>): Promise<ApiServiceResponse<GetByIdMaterialGroupResponse>> => {
            return await api.post("/guide/materialGroup",
                {...options.options},
                { signal: options.controller?.signal }
            ).then((response) => {
                return handleApiSuccess(
                    response.data,
                    response.status === 201 && response.data,
                    options.errorOptions?.placeholder,
                );
            }).catch((error) => handleApiError(error, options.errorOptions));
        },

        patch: async (options: ApiServiceOptions<{
            id: number,
            options: PathMaterialGroupOptions;
        }>): Promise<ApiServiceResponse<GetByIdMaterialGroupResponse>> => {
            return await api.patch(`/guide/materialGroup/${options.id}`,
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

        delete: async (options: ApiServiceOptions<{
            ids: number[];
        }>): Promise<ApiServiceResponse<ActionByTableResponse>> => {
            return await api.delete("/guide/materialGroup", {
                signal: options.controller?.signal,
                data: options.ids,
            }).then((response) => {
                return handleApiSuccess(
                    response.data,
                    response.status === 200 && response.data,
                    options.errorOptions?.placeholder,
                );
            }).catch((error) => handleApiError(error, options.errorOptions));
        },

        table: {
            get: async (options: ApiServiceOptions<{
                options?: GetTableOptions;
            }>): Promise<ApiServiceResponse<GetTableResponse<MaterialGroupTableRow[]>>> => {
                return await api.get("/guide/materialGroup/table", {
                    signal: options.controller?.signal,
                    params: buildTableOptions(options.options),
                }).then((response) => {
                    return handleApiSuccess(
                        response.data,
                        response.status === 200 && response.data,
                        options.errorOptions?.placeholder,
                    );
                }).catch((error) => handleApiError(error, options.errorOptions));
            },

            patch: async (options: ApiServiceOptions<{
                options: PatchMaterialGroupTableOptions;
            }>): Promise<ApiServiceResponse<ActionByTableResponse>> => {
                return await api.patch("/guide/materialGroup/table",
                    options.options,
                    { signal: options.controller?.signal }
                ).then((response) => {
                    return handleApiSuccess(
                        response.data,
                        response.status === 200 && response.data,
                        options.errorOptions?.placeholder,
                    );
                }).catch((error) => handleApiError(error, options.errorOptions));
            },
        }
    },

    operationGroup: {
        getById: async (options: ApiServiceOptions<{
            id: number
        }>): Promise<ApiServiceResponse<GetByIdOperationGroupResponse>> => {
            return await api.get(`/guide/operationGroup/${options.id}`, {
                signal: options.controller?.signal
            }).then(r => {
                return handleApiSuccess(
                    r.data,
                    r.status === 200 && r.data,
                    options.errorOptions?.placeholder
                );
            }).catch((e) => handleApiError(e, options.errorOptions));
        },

        post: async (options: ApiServiceOptions<{
            options: PostOperationGroupOptions;
        }>): Promise<ApiServiceResponse<GetByIdOperationGroupResponse>> => {
            return await api.post("/guide/operationGroup",
                {...options.options},
                { signal: options.controller?.signal }
            ).then((response) => {
                return handleApiSuccess(
                    response.data,
                    response.status === 201 && response.data,
                    options.errorOptions?.placeholder,
                );
            }).catch((error) => handleApiError(error, options.errorOptions));
        },

        patch: async (options: ApiServiceOptions<{
            id: number,
            options: PathOperationGroupOptions;
        }>): Promise<ApiServiceResponse<GetByIdOperationGroupResponse>> => {
            return await api.patch(`/guide/operationGroup/${options.id}`,
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

        delete: async (options: ApiServiceOptions<{
            ids: number[];
        }>): Promise<ApiServiceResponse<ActionByTableResponse>> => {
            return await api.delete("/guide/operationGroup", {
                signal: options.controller?.signal,
                data: options.ids,
            }).then((response) => {
                return handleApiSuccess(
                    response.data,
                    response.status === 200 && response.data,
                    options.errorOptions?.placeholder,
                );
            }).catch((error) => handleApiError(error, options.errorOptions));
        },

        table: {
            get: async (options: ApiServiceOptions<{
                options?: GetTableOptions;
            }>): Promise<ApiServiceResponse<GetTableResponse<OperationGroupTableRow[]>>> => {
                return await api.get("/guide/operationGroup/table", {
                    signal: options.controller?.signal,
                    params: buildTableOptions(options.options),
                }).then((response) => {
                    return handleApiSuccess(
                        response.data,
                        response.status === 200 && response.data,
                        options.errorOptions?.placeholder,
                    );
                }).catch((error) => handleApiError(error, options.errorOptions));
            },

            patch: async (options: ApiServiceOptions<{
                options: PatchOperationGroupTableOptions;
            }>): Promise<ApiServiceResponse<ActionByTableResponse>> => {
                return await api.patch("/guide/operationGroup/table",
                    options.options,
                    { signal: options.controller?.signal }
                ).then((response) => {
                    return handleApiSuccess(
                        response.data,
                        response.status === 200 && response.data,
                        options.errorOptions?.placeholder,
                    );
                }).catch((error) => handleApiError(error, options.errorOptions));
            },
        }
    },

    typeProducts: {
        getById: async (options: ApiServiceOptions<{
            id: number
        }>): Promise<ApiServiceResponse<GetByIdTypeProductsResponse>> => {
            return await api.get(`/guide/typeProducts/${options.id}`, {
                signal: options.controller?.signal
            }).then(r => {
                return handleApiSuccess(
                    r.data,
                    r.status === 200 && r.data,
                    options.errorOptions?.placeholder
                );
            }).catch((e) => handleApiError(e, options.errorOptions));
        },

        post: async (options: ApiServiceOptions<{
            options: PostTypeProductsOptions;
        }>): Promise<ApiServiceResponse<GetByIdTypeProductsResponse>> => {
            return await api.post("/guide/typeProducts",
                {...options.options},
                { signal: options.controller?.signal }
            ).then((response) => {
                return handleApiSuccess(
                    response.data,
                    response.status === 201 && response.data,
                    options.errorOptions?.placeholder,
                );
            }).catch((error) => handleApiError(error, options.errorOptions));
        },

        patch: async (options: ApiServiceOptions<{
            id: number,
            options: PathTypeProductsOptions;
        }>): Promise<ApiServiceResponse<GetByIdTypeProductsResponse>> => {
            return await api.patch(`/guide/typeProducts/${options.id}`,
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

        delete: async (options: ApiServiceOptions<{
            ids: number[];
        }>): Promise<ApiServiceResponse<ActionByTableResponse>> => {
            return await api.delete("/guide/typeProducts", {
                signal: options.controller?.signal,
                data: options.ids,
            }).then((response) => {
                return handleApiSuccess(
                    response.data,
                    response.status === 200 && response.data,
                    options.errorOptions?.placeholder,
                );
            }).catch((error) => handleApiError(error, options.errorOptions));
        },

        table: {
            get: async (options: ApiServiceOptions<{
                options?: GetTableOptions;
            }>): Promise<ApiServiceResponse<GetTableResponse<TypeProductsTableRow[]>>> => {
                return await api.get("/guide/typeProducts/table", {
                    signal: options.controller?.signal,
                    params: buildTableOptions(options.options),
                }).then((response) => {
                    return handleApiSuccess(
                        response.data,
                        response.status === 200 && response.data,
                        options.errorOptions?.placeholder,
                    );
                }).catch((error) => handleApiError(error, options.errorOptions));
            },

            patch: async (options: ApiServiceOptions<{
                options: PatchTypeProductsTableOptions;
            }>): Promise<ApiServiceResponse<ActionByTableResponse>> => {
                return await api.patch("/guide/typeProducts/table",
                    options.options,
                    { signal: options.controller?.signal }
                ).then((response) => {
                    return handleApiSuccess(
                        response.data,
                        response.status === 200 && response.data,
                        options.errorOptions?.placeholder,
                    );
                }).catch((error) => handleApiError(error, options.errorOptions));
            },
        }
    }
}
