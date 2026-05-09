import {
    ApiServiceOptions,
    ApiServiceResponse,
    GetTableOptions,
    GetTableResponse
} from "@/apiService/types";
import {api, buildTableOptions, handleApiError, handleApiSuccess} from "@/apiService/apiService";
import {
    GetByIdProcessOperationResponse,
    GetProcessOperationsTableFilters,
    PatchProcessOperationOptions,
    ProcessOperationSelectedItem,
    ProcessOperationTableRow
} from "@/apiService/apiProcessOperations/types";
import {createProcessOperationOptions} from "@/apiService/apiProcessOperations/helpers";

const buildProcessOperationTableOptions = (options?: GetTableOptions<Partial<GetProcessOperationsTableFilters>>) => {
    const {operationGroupId, ...restOptions} = options ?? {};

    return {
        ...buildTableOptions(restOptions),
        ...(typeof operationGroupId === "number" && operationGroupId > 0 ? {operationGroupId} : undefined),
    };
};

export const ApiProcessOperations = {
    get: async (options: ApiServiceOptions<{
        processId: number;
    }>): Promise<ApiServiceResponse<ProcessOperationSelectedItem[]>> => {
        return await api.get("/process-operations", {
            signal: options.controller?.signal,
            params: {processId: options.processId},
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
    }>): Promise<ApiServiceResponse<GetByIdProcessOperationResponse>> => {
        return await api.get(`/process-operations/${options.id}`, {
            signal: options.controller?.signal
        }).then((response) => {
            return handleApiSuccess(
                response.data,
                response.status === 200 && response.data,
                options.errorOptions?.placeholder,
            );
        }).catch((error) => handleApiError(error, options.errorOptions));
    },

    putProcessOperations: async (options: ApiServiceOptions<{
        processId: number;
        operationIds: number[];
    }>): Promise<ApiServiceResponse<ProcessOperationSelectedItem[]>> => {
        return await api.put(`/process-operations/process/${options.processId}`,
            {operationIds: options.operationIds},
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
        options: PatchProcessOperationOptions;
    }>): Promise<ApiServiceResponse<GetByIdProcessOperationResponse>> => {
        return await api.patch(`/process-operations/${options.id}`,
            createProcessOperationOptions(options.options),
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
            options: GetTableOptions<Partial<GetProcessOperationsTableFilters>>;
        }>): Promise<ApiServiceResponse<GetTableResponse<ProcessOperationTableRow[]>>> => {
            return await api.get("/process-operations/table", {
                signal: options.controller?.signal,
                params: buildProcessOperationTableOptions(options.options),
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
