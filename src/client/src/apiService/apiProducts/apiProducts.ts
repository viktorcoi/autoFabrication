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
    GetByIdProductResponse,
    GetProductsResponse,
    GetProductsTableFilters,
    PatchProductsTableOptions,
    PathProductOptions,
    PostProductOptions,
    ProductsTableRow
} from "@/apiService/apiProducts/types";
import {createProductOptions, getProductDateRangeParams} from "@/apiService/apiProducts/helpers";

const buildProductsTableOptions = (options?: GetTableOptions<Partial<GetProductsTableFilters>>) => {
    const {createdAt, ...restOptions} = options ?? {};

    return {
        ...buildTableOptions(restOptions),
        ...getProductDateRangeParams(createdAt),
    };
};

export const ApiProducts = {
    get: async (options: ApiServiceOptions<{
        options?: GetListOptions;
    }> = {}): Promise<ApiServiceResponse<GetProductsResponse[]>> => {
        return await api.get("/products", {
            signal: options.controller?.signal,
            params: buildGetOptions(options.options),
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
    }>): Promise<ApiServiceResponse<GetByIdProductResponse>> => {
        return await api.get(`/products/${options.id}`, {
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
        options: PostProductOptions;
    }>): Promise<ApiServiceResponse<GetByIdProductResponse>> => {
        return await api.post("/products",
            createProductOptions(options.options),
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
        options: PathProductOptions;
    }>): Promise<ApiServiceResponse<GetByIdProductResponse>> => {
        return await api.patch(`/products/${options.id}`,
            createProductOptions(options.options),
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
        return await api.delete("/products", {
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
            options?: GetTableOptions<Partial<GetProductsTableFilters>>;
        }>): Promise<ApiServiceResponse<GetTableResponse<ProductsTableRow[]>>> => {
            return await api.get("/products/table", {
                signal: options.controller?.signal,
                params: buildProductsTableOptions(options.options),
            }).then((response) => {
                return handleApiSuccess(
                    response.data,
                    response.status === 200 && response.data,
                    options.errorOptions?.placeholder,
                );
            }).catch((error) => handleApiError(error, options.errorOptions));
        },

        patch: async (options: ApiServiceOptions<{
            options: PatchProductsTableOptions;
        }>): Promise<ApiServiceResponse<ActionByTableResponse>> => {
            return await api.patch("/products/table",
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
