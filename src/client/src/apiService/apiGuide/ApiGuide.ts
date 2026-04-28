import {
    ActionByTableResponse,
    ApiServiceOptions,
    ApiServiceResponse,
    GetTableOptions,
    GetTableResponse
} from "@/apiService/types";
import {api, buildTableOptions, handleApiError, handleApiSuccess} from "@/apiService/apiService";
import {
    GetByIdTypeProductsResponse,
    PatchTypeProductsTableOptions, PathTypeProductsOptions, PostTypeProductsOptions,
    TypeProductsTableRow
} from "@/apiService/apiGuide/types";

export const ApiGuide = {
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
