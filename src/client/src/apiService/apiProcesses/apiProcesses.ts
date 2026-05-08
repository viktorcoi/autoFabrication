import {
    ActionByTableResponse,
    ApiServiceOptions,
    ApiServiceResponse,
    GetTableOptions,
    GetTableResponse
} from "@/apiService/types";
import {api, buildTableOptions, handleApiError, handleApiSuccess} from "@/apiService/apiService";
import {
    GetByIdProcessResponse,
    GetProcessTableFilters,
    PatchProcessTableOptions,
    PathProcessOptions,
    PostProcessOptions,
    ProcessTableRow
} from "@/apiService/apiProcesses/types";
import {createProcessOptions} from "@/apiService/apiProcesses/helpers";

export const ApiProcesses = {
    getById: async (options: ApiServiceOptions<{
        id: number
    }>): Promise<ApiServiceResponse<GetByIdProcessResponse>> => {
        return await api.get(`/processes/${options.id}`, {
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
        options: PostProcessOptions;
    }>): Promise<ApiServiceResponse<GetByIdProcessResponse>> => {
        return await api.post("/processes",
            createProcessOptions(options.options),
            {signal: options.controller?.signal}
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
        options: PathProcessOptions;
    }>): Promise<ApiServiceResponse<GetByIdProcessResponse>> => {
        return await api.patch(`/processes/${options.id}`,
            createProcessOptions(options.options),
            {signal: options.controller?.signal}
        ).then((response) => {
            return handleApiSuccess(
                response.data,
                response.status === 200 && response.data,
                options.errorOptions?.placeholder,
            );
        }).catch((error) => handleApiError(error, options.errorOptions));
    },

    patchAccess: async (options: ApiServiceOptions<{
        id: number;
        disabled: boolean;
    }>): Promise<ApiServiceResponse<GetByIdProcessResponse>> => {
        return await api.patch(`/processes/${options.id}/access`,
            {disabled: options.disabled},
            {signal: options.controller?.signal}
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
        return await api.delete("/processes", {
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
            options: GetTableOptions<GetProcessTableFilters>;
        }>): Promise<ApiServiceResponse<GetTableResponse<ProcessTableRow[]>>> => {
            return await api.get("/processes/table", {
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
            options: PatchProcessTableOptions;
        }>): Promise<ApiServiceResponse<ActionByTableResponse>> => {
            return await api.patch("/processes/table",
                options.options,
                {signal: options.controller?.signal}
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
