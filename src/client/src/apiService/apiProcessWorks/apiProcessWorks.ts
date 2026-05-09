import {
    ApiServiceOptions,
    ApiServiceResponse,
    GetTableOptions,
    GetTableResponse
} from "@/apiService/types";
import {api, buildTableOptions, handleApiError, handleApiSuccess} from "@/apiService/apiService";
import {
    GetByIdProcessWorkResponse,
    GetProcessWorksTableFilters,
    PatchProcessWorkOptions,
    ProcessWorkSelectedItem,
    ProcessWorkTableRow,
    PutProcessWorksOptions
} from "@/apiService/apiProcessWorks/types";

const buildProcessWorkTableOptions = (options?: GetTableOptions<Partial<GetProcessWorksTableFilters>>) => {
    const {workGroupId, ...restOptions} = options ?? {};

    return {
        ...buildTableOptions(restOptions),
        ...(typeof workGroupId === "number" && workGroupId > 0 ? {workGroupId} : undefined),
    };
};

export const ApiProcessWorks = {
    get: async (options: ApiServiceOptions<{
        stepId: number;
    }>): Promise<ApiServiceResponse<ProcessWorkSelectedItem[]>> => {
        return await api.get("/process-works", {
            signal: options.controller?.signal,
            params: {stepId: options.stepId},
        }).then((response) => {
            return handleApiSuccess(
                response.data,
                response.status === 200 && Array.isArray(response.data),
                options.errorOptions?.placeholder,
            );
        }).catch((error) => handleApiError(error, options.errorOptions));
    },

    getById: async (options: ApiServiceOptions<{
        id: number;
    }>): Promise<ApiServiceResponse<GetByIdProcessWorkResponse>> => {
        return await api.get(`/process-works/${options.id}`, {
            signal: options.controller?.signal
        }).then((response) => {
            return handleApiSuccess(
                response.data,
                response.status === 200 && response.data,
                options.errorOptions?.placeholder,
            );
        }).catch((error) => handleApiError(error, options.errorOptions));
    },

    putProcessWorks: async (options: ApiServiceOptions<{
        stepId: number;
        options: PutProcessWorksOptions;
    }>): Promise<ApiServiceResponse<ProcessWorkSelectedItem[]>> => {
        return await api.put(`/process-works/step/${options.stepId}`,
            options.options,
            {signal: options.controller?.signal}
        ).then((response) => {
            return handleApiSuccess(
                response.data,
                response.status === 200 && Array.isArray(response.data),
                options.errorOptions?.placeholder,
            );
        }).catch((error) => handleApiError(error, options.errorOptions));
    },

    patch: async (options: ApiServiceOptions<{
        id: number;
        options: PatchProcessWorkOptions;
    }>): Promise<ApiServiceResponse<GetByIdProcessWorkResponse>> => {
        return await api.patch(`/process-works/${options.id}`,
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

    table: {
        get: async (options: ApiServiceOptions<{
            options: GetTableOptions<Partial<GetProcessWorksTableFilters>>;
        }>): Promise<ApiServiceResponse<GetTableResponse<ProcessWorkTableRow[]>>> => {
            return await api.get("/process-works/table", {
                signal: options.controller?.signal,
                params: buildProcessWorkTableOptions(options.options),
            }).then((response) => {
                return handleApiSuccess(
                    response.data,
                    response.status === 200 && response.data,
                    options.errorOptions?.placeholder,
                );
            }).catch((error) => handleApiError(error, options.errorOptions));
        },
    }
};
