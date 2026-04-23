import {ApiServiceOptions, ApiServiceResponse, GetTableOptions, GetTableResponse} from "@/apiService/types";
import {api, buildTableOptions, handleApiError, handleApiSuccess} from "@/apiService/apiService";
import {CreateUserOptions, GetByIdUserResponse, UserTableRow} from "@/apiService/apiUsers/types";

export const ApiUsers = {
	post: async (options: ApiServiceOptions<{
		options: CreateUserOptions;
	}>): Promise<ApiServiceResponse<GetByIdUserResponse>> => {
		return await api.post("/users",
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

	table: {
		get: async (options: ApiServiceOptions<{
			options?: GetTableOptions;
		}>): Promise<ApiServiceResponse<GetTableResponse<UserTableRow[]>>> => {
			return await api.get("/users/table", {
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
