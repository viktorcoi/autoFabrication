import {
    ActionByTableResponse,
    ApiServiceOptions,
    ApiServiceResponse,
    GetListOptions,
    GetTableOptions,
    GetTableResponse
} from "@/apiService/types";
import {api, buildGetOptions, buildTableOptions, handleApiError, handleApiSuccess} from "@/apiService/apiService";
import {
    GetByIdMaterialGroupResponse,
    GetByIdBlankResponse,
    GetByIdMaterialResponse,
    GetByIdOperationResponse,
    GetByIdOperationGroupResponse,
    GetByIdWorkResponse,
    GetByIdWorkGroupResponse,
    GetByIdTypeProductsResponse,
    GetTypeProductsResponse,
    GetMaterialsResponse,
    GetBlanksResponse,
    GetMaterialGroupsResponse,
    GetOperationsResponse,
    GetWorksResponse,
    GetOperationGroupsResponse,
    GetWorkGroupsResponse,
    BlankTableRow,
    MaterialGroupTableRow,
    MaterialTableRow,
    OperationTableRow,
    OperationGroupTableRow,
    WorkTableRow,
    WorkGroupTableRow,
    PatchBlankTableOptions,
    PatchMaterialGroupTableOptions,
    PatchMaterialTableOptions,
    PatchOperationTableOptions,
    PatchOperationGroupTableOptions,
    PatchWorkTableOptions,
    PatchWorkGroupTableOptions,
    PatchTypeProductsTableOptions,
    PathMaterialGroupOptions,
    PathBlankOptions,
    PathMaterialOptions,
    PathOperationOptions,
    PathOperationGroupOptions,
    PathWorkOptions,
    PathWorkGroupOptions,
    PathTypeProductsOptions,
    PostBlankOptions,
    PostMaterialGroupOptions,
    PostMaterialOptions,
    PostOperationOptions,
    PostOperationGroupOptions,
    PostWorkOptions,
    PostWorkGroupOptions,
    PostTypeProductsOptions,
    TypeProductsTableRow,
    GetWorksTableFilters,
    GetWorkGroupsTableFilters,
    GetMaterialsTableFilters,
    GetBlanksTableFilters,
    GetOperationsTableFilters,
} from "@/apiService/apiGuide/types";
import {createOperationOptions, createWorkOptions} from "@/apiService/apiGuide/helpers";

type GuideListOptions<T extends object = object> = GetListOptions<T & {
    forSelect?: boolean;
}>;

const buildGuideListOptions = <T extends object = object>(options?: GuideListOptions<T>) => {
    const {forSelect, ...restOptions} = options ?? {};

    return buildGetOptions({
        ...restOptions,
        forSelect: forSelect ?? true,
    });
};

export const ApiGuide = {
    materialGroup: {
        get: async (options: ApiServiceOptions<{
            options?: GuideListOptions;
        }> = {}): Promise<ApiServiceResponse<GetMaterialGroupsResponse[]>> => {
            return await api.get("/guide/materialGroup", {
                signal: options.controller?.signal,
                params: buildGuideListOptions(options.options),
            }).then((response) => {
                return handleApiSuccess(
                    response.data,
                    response.status === 200 && Array.isArray(response.data),
                    options.errorOptions?.placeholder,
                );
            }).catch((error) => handleApiError(error, options.errorOptions));
        },

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
        get: async (options: ApiServiceOptions<{
            options?: GuideListOptions;
        }> = {}): Promise<ApiServiceResponse<GetOperationGroupsResponse[]>> => {
            return await api.get("/guide/operationGroup", {
                signal: options.controller?.signal,
                params: buildGuideListOptions(options.options),
            }).then((response) => {
                return handleApiSuccess(
                    response.data,
                    response.status === 200 && Array.isArray(response.data),
                    options.errorOptions?.placeholder,
                );
            }).catch((error) => handleApiError(error, options.errorOptions));
        },

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

    operation: {
        get: async (options: ApiServiceOptions<{
            options?: GuideListOptions<{
                operationGroupId?: number;
            }>;
        }> = {}): Promise<ApiServiceResponse<GetOperationsResponse[]>> => {
            return await api.get("/guide/operation", {
                signal: options.controller?.signal,
                params: buildGuideListOptions({
                    ...(typeof options.options?.operationGroupId === "number" && options.options.operationGroupId > 0
                        ? { operationGroupId: options.options.operationGroupId }
                        : undefined),
                    search: options.options?.search,
                    sorting: options.options?.sorting,
                    forSelect: options.options?.forSelect,
                }),
            }).then((response) => {
                return handleApiSuccess(
                    response.data,
                    response.status === 200 && Array.isArray(response.data),
                    options.errorOptions?.placeholder,
                );
            }).catch((error) => handleApiError(error, options.errorOptions));
        },

        getById: async (options: ApiServiceOptions<{
            id: number
        }>): Promise<ApiServiceResponse<GetByIdOperationResponse>> => {
            return await api.get(`/guide/operation/${options.id}`, {
                signal: options.controller?.signal
            }).then((response) => {
                return handleApiSuccess(
                    response.data,
                    response.status === 200 && response.data,
                    options.errorOptions?.placeholder,
                );
            }).catch((error) => handleApiError(error, options.errorOptions));
        },

        post: async (options: ApiServiceOptions<{
            options: PostOperationOptions;
        }>): Promise<ApiServiceResponse<GetByIdOperationResponse>> => {
            return await api.post("/guide/operation",
                createOperationOptions(options.options),
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
            options: PathOperationOptions;
        }>): Promise<ApiServiceResponse<GetByIdOperationResponse>> => {
            return await api.patch(`/guide/operation/${options.id}`,
                createOperationOptions(options.options),
                { signal: options.controller?.signal }
            ).then((response) => {
                return handleApiSuccess(
                    response.data,
                    response.status === 200 && response.data,
                    options.errorOptions?.placeholder,
                );
            }).catch((error) => handleApiError(error, options.errorOptions));
        },

        delete: async (options: ApiServiceOptions<{
            ids: number[];
        }>): Promise<ApiServiceResponse<ActionByTableResponse>> => {
            return await api.delete("/guide/operation", {
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
                options?: GetTableOptions<Partial<GetOperationsTableFilters>>;
            }>): Promise<ApiServiceResponse<GetTableResponse<OperationTableRow[]>>> => {
                return await api.get("/guide/operation/table", {
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
                options: PatchOperationTableOptions;
            }>): Promise<ApiServiceResponse<ActionByTableResponse>> => {
                return await api.patch("/guide/operation/table",
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

    material: {
        get: async (options: ApiServiceOptions<{
            options?: GuideListOptions<{
                materialGroupId?: number;
            }>;
        }> = {}): Promise<ApiServiceResponse<GetMaterialsResponse[]>> => {
            return await api.get("/guide/material", {
                signal: options.controller?.signal,
                params: buildGuideListOptions({
                    ...(typeof options.options?.materialGroupId === "number" && options.options.materialGroupId > 0
                        ? { materialGroupId: options.options.materialGroupId }
                        : undefined),
                    search: options.options?.search,
                    sorting: options.options?.sorting,
                    forSelect: options.options?.forSelect,
                }),
            }).then((response) => {
                return handleApiSuccess(
                    response.data,
                    response.status === 200 && Array.isArray(response.data),
                    options.errorOptions?.placeholder,
                );
            }).catch((error) => handleApiError(error, options.errorOptions));
        },

        getById: async (options: ApiServiceOptions<{
            id: number
        }>): Promise<ApiServiceResponse<GetByIdMaterialResponse>> => {
            return await api.get(`/guide/material/${options.id}`, {
                signal: options.controller?.signal
            }).then((response) => {
                return handleApiSuccess(
                    response.data,
                    response.status === 200 && response.data,
                    options.errorOptions?.placeholder,
                );
            }).catch((error) => handleApiError(error, options.errorOptions));
        },

        post: async (options: ApiServiceOptions<{
            options: PostMaterialOptions;
        }>): Promise<ApiServiceResponse<GetByIdMaterialResponse>> => {
            return await api.post("/guide/material",
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
            options: PathMaterialOptions;
        }>): Promise<ApiServiceResponse<GetByIdMaterialResponse>> => {
            return await api.patch(`/guide/material/${options.id}`,
                {...options.options},
                { signal: options.controller?.signal }
            ).then((response) => {
                return handleApiSuccess(
                    response.data,
                    response.status === 200 && response.data,
                    options.errorOptions?.placeholder,
                );
            }).catch((error) => handleApiError(error, options.errorOptions));
        },

        delete: async (options: ApiServiceOptions<{
            ids: number[];
        }>): Promise<ApiServiceResponse<ActionByTableResponse>> => {
            return await api.delete("/guide/material", {
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
                options?: GetTableOptions<Partial<GetMaterialsTableFilters>>;
            }>): Promise<ApiServiceResponse<GetTableResponse<MaterialTableRow[]>>> => {
                return await api.get("/guide/material/table", {
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
                options: PatchMaterialTableOptions;
            }>): Promise<ApiServiceResponse<ActionByTableResponse>> => {
                return await api.patch("/guide/material/table",
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

    blank: {
        get: async (options: ApiServiceOptions<{
            options?: GuideListOptions<{
                materialGroupId?: number;
                materialId?: number;
            }>;
        }> = {}): Promise<ApiServiceResponse<GetBlanksResponse[]>> => {
            return await api.get("/guide/blank", {
                signal: options.controller?.signal,
                params: buildGuideListOptions({
                    ...(typeof options.options?.materialGroupId === "number" && options.options.materialGroupId > 0
                        ? { materialGroupId: options.options.materialGroupId }
                        : undefined),
                    ...(typeof options.options?.materialId === "number" && options.options.materialId > 0
                        ? { materialId: options.options.materialId }
                        : undefined),
                    search: options.options?.search,
                    sorting: options.options?.sorting,
                    forSelect: options.options?.forSelect,
                }),
            }).then((response) => {
                return handleApiSuccess(
                    response.data,
                    response.status === 200 && Array.isArray(response.data),
                    options.errorOptions?.placeholder,
                );
            }).catch((error) => handleApiError(error, options.errorOptions));
        },

        getById: async (options: ApiServiceOptions<{
            id: number
        }>): Promise<ApiServiceResponse<GetByIdBlankResponse>> => {
            return await api.get(`/guide/blank/${options.id}`, {
                signal: options.controller?.signal
            }).then((response) => {
                return handleApiSuccess(
                    response.data,
                    response.status === 200 && response.data,
                    options.errorOptions?.placeholder,
                );
            }).catch((error) => handleApiError(error, options.errorOptions));
        },

        post: async (options: ApiServiceOptions<{
            options: PostBlankOptions;
        }>): Promise<ApiServiceResponse<GetByIdBlankResponse>> => {
            return await api.post("/guide/blank",
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
            options: PathBlankOptions;
        }>): Promise<ApiServiceResponse<GetByIdBlankResponse>> => {
            return await api.patch(`/guide/blank/${options.id}`,
                {...options.options},
                { signal: options.controller?.signal }
            ).then((response) => {
                return handleApiSuccess(
                    response.data,
                    response.status === 200 && response.data,
                    options.errorOptions?.placeholder,
                );
            }).catch((error) => handleApiError(error, options.errorOptions));
        },

        delete: async (options: ApiServiceOptions<{
            ids: number[];
        }>): Promise<ApiServiceResponse<ActionByTableResponse>> => {
            return await api.delete("/guide/blank", {
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
                options?: GetTableOptions<Partial<GetBlanksTableFilters>>;
            }>): Promise<ApiServiceResponse<GetTableResponse<BlankTableRow[]>>> => {
                return await api.get("/guide/blank/table", {
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
                options: PatchBlankTableOptions;
            }>): Promise<ApiServiceResponse<ActionByTableResponse>> => {
                return await api.patch("/guide/blank/table",
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

    workGroup: {
        get: async (options: ApiServiceOptions<{
            options?: GuideListOptions<{
                operationGroupId?: number;
                operationId?: number;
            }>;
        }> = {}): Promise<ApiServiceResponse<GetWorkGroupsResponse[]>> => {
            return await api.get("/guide/workGroup", {
                signal: options.controller?.signal,
                params: buildGuideListOptions({
                    ...(typeof options.options?.operationGroupId === "number" && options.options.operationGroupId > 0
                        ? { operationGroupId: options.options.operationGroupId }
                        : undefined),
                    ...(typeof options.options?.operationId === "number" && options.options.operationId > 0
                        ? { operationId: options.options.operationId }
                        : undefined),
                    search: options.options?.search,
                    sorting: options.options?.sorting,
                    forSelect: options.options?.forSelect,
                }),
            }).then((response) => {
                return handleApiSuccess(
                    response.data,
                    response.status === 200 && Array.isArray(response.data),
                    options.errorOptions?.placeholder,
                );
            }).catch((error) => handleApiError(error, options.errorOptions));
        },

        getById: async (options: ApiServiceOptions<{
            id: number
        }>): Promise<ApiServiceResponse<GetByIdWorkGroupResponse>> => {
            return await api.get(`/guide/workGroup/${options.id}`, {
                signal: options.controller?.signal
            }).then((response) => {
                return handleApiSuccess(
                    response.data,
                    response.status === 200 && response.data,
                    options.errorOptions?.placeholder,
                );
            }).catch((error) => handleApiError(error, options.errorOptions));
        },

        post: async (options: ApiServiceOptions<{
            options: PostWorkGroupOptions;
        }>): Promise<ApiServiceResponse<GetByIdWorkGroupResponse>> => {
            return await api.post("/guide/workGroup",
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
            options: PathWorkGroupOptions;
        }>): Promise<ApiServiceResponse<GetByIdWorkGroupResponse>> => {
            return await api.patch(`/guide/workGroup/${options.id}`,
                {...options.options},
                { signal: options.controller?.signal }
            ).then((response) => {
                return handleApiSuccess(
                    response.data,
                    response.status === 200 && response.data,
                    options.errorOptions?.placeholder,
                );
            }).catch((error) => handleApiError(error, options.errorOptions));
        },

        delete: async (options: ApiServiceOptions<{
            ids: number[];
        }>): Promise<ApiServiceResponse<ActionByTableResponse>> => {
            return await api.delete("/guide/workGroup", {
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
                options?: GetTableOptions<Partial<GetWorkGroupsTableFilters>>;
            }>): Promise<ApiServiceResponse<GetTableResponse<WorkGroupTableRow[]>>> => {
                return await api.get("/guide/workGroup/table", {
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
                options: PatchWorkGroupTableOptions;
            }>): Promise<ApiServiceResponse<ActionByTableResponse>> => {
                return await api.patch("/guide/workGroup/table",
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

    work: {
        get: async (options: ApiServiceOptions<{
            options?: GuideListOptions<{
                operationId?: number;
                workGroupId?: number;
            }>;
        }> = {}): Promise<ApiServiceResponse<GetWorksResponse[]>> => {
            return await api.get("/guide/work", {
                signal: options.controller?.signal,
                params: buildGuideListOptions({
                    ...(typeof options.options?.operationId === "number" && options.options.operationId > 0
                        ? { operationId: options.options.operationId }
                        : undefined),
                    ...(typeof options.options?.workGroupId === "number" && options.options.workGroupId > 0
                        ? { workGroupId: options.options.workGroupId }
                        : undefined),
                    search: options.options?.search,
                    sorting: options.options?.sorting,
                    forSelect: options.options?.forSelect,
                }),
            }).then((response) => {
                return handleApiSuccess(
                    response.data,
                    response.status === 200 && Array.isArray(response.data),
                    options.errorOptions?.placeholder,
                );
            }).catch((error) => handleApiError(error, options.errorOptions));
        },

        getById: async (options: ApiServiceOptions<{
            id: number
        }>): Promise<ApiServiceResponse<GetByIdWorkResponse>> => {
            return await api.get(`/guide/work/${options.id}`, {
                signal: options.controller?.signal
            }).then((response) => {
                return handleApiSuccess(
                    response.data,
                    response.status === 200 && response.data,
                    options.errorOptions?.placeholder,
                );
            }).catch((error) => handleApiError(error, options.errorOptions));
        },

        post: async (options: ApiServiceOptions<{
            options: PostWorkOptions;
        }>): Promise<ApiServiceResponse<GetByIdWorkResponse>> => {
            return await api.post("/guide/work",
                createWorkOptions(options.options),
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
            options: PathWorkOptions;
        }>): Promise<ApiServiceResponse<GetByIdWorkResponse>> => {
            return await api.patch(`/guide/work/${options.id}`,
                createWorkOptions(options.options),
                { signal: options.controller?.signal }
            ).then((response) => {
                return handleApiSuccess(
                    response.data,
                    response.status === 200 && response.data,
                    options.errorOptions?.placeholder,
                );
            }).catch((error) => handleApiError(error, options.errorOptions));
        },

        delete: async (options: ApiServiceOptions<{
            ids: number[];
        }>): Promise<ApiServiceResponse<ActionByTableResponse>> => {
            return await api.delete("/guide/work", {
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
                options?: GetTableOptions<Partial<GetWorksTableFilters>>;
            }>): Promise<ApiServiceResponse<GetTableResponse<WorkTableRow[]>>> => {
                return await api.get("/guide/work/table", {
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
                options: PatchWorkTableOptions;
            }>): Promise<ApiServiceResponse<ActionByTableResponse>> => {
                return await api.patch("/guide/work/table",
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
        get: async (options: ApiServiceOptions<{
            options?: GuideListOptions;
        }> = {}): Promise<ApiServiceResponse<GetTypeProductsResponse[]>> => {
            return await api.get("/guide/typeProducts", {
                signal: options.controller?.signal,
                params: buildGuideListOptions(options.options),
            }).then((response) => {
                return handleApiSuccess(
                    response.data,
                    response.status === 200 && Array.isArray(response.data),
                    options.errorOptions?.placeholder,
                );
            }).catch((error) => handleApiError(error, options.errorOptions));
        },

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
