import {
    ApiServiceOptions,
    ApiServiceResponse,
    GetTableOptions,
    GetTableResponse
} from "@/apiService/types";
import {api, buildTableOptions, handleApiError, handleApiSuccess} from "@/apiService/apiService";
import {
    GetByIdProcessStepResponse,
    GetProcessStepsTableFilters,
    PatchProcessStepOptions,
    PostProcessStepOptions,
    ProcessStepSelectedItem,
    ProcessStepTableRow,
    PutProcessStepsOptions
} from "@/apiService/apiProcessSteps/types";
import {
    createProcessStepOptions,
    createProcessStepsOptions
} from "@/apiService/apiProcessSteps/helpers";

export const ApiProcessSteps = {
    get: async (options: ApiServiceOptions<{
        operationId: number;
    }>): Promise<ApiServiceResponse<ProcessStepSelectedItem[]>> => {
        return await api.get("/process-steps", {
            signal: options.controller?.signal,
            params: {operationId: options.operationId},
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
    }>): Promise<ApiServiceResponse<GetByIdProcessStepResponse>> => {
        return await api.get(`/process-steps/${options.id}`, {
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
        operationId: number;
        options: PostProcessStepOptions;
    }>): Promise<ApiServiceResponse<GetByIdProcessStepResponse>> => {
        return await api.post(`/process-steps/operation/${options.operationId}`,
            createProcessStepOptions(options.options),
            {signal: options.controller?.signal}
        ).then((response) => {
            return handleApiSuccess(
                response.data,
                response.status === 201 && response.data,
                options.errorOptions?.placeholder,
            );
        }).catch((error) => handleApiError(error, options.errorOptions));
    },

    putProcessSteps: async (options: ApiServiceOptions<{
        operationId: number;
        options: PutProcessStepsOptions;
    }>): Promise<ApiServiceResponse<ProcessStepSelectedItem[]>> => {
        return await api.put(`/process-steps/operation/${options.operationId}`,
            createProcessStepsOptions(options.options),
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
        options: PatchProcessStepOptions;
    }>): Promise<ApiServiceResponse<GetByIdProcessStepResponse>> => {
        return await api.patch(`/process-steps/${options.id}`,
            createProcessStepOptions(options.options),
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
            options: GetTableOptions<Partial<GetProcessStepsTableFilters>>;
        }>): Promise<ApiServiceResponse<GetTableResponse<ProcessStepTableRow[]>>> => {
            return await api.get("/process-steps/table", {
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
    }
};
