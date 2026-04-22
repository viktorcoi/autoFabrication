import {ApiServiceOptions, ApiServiceResponse, GetTableResponse} from "@/apiService/types";
import { api, handleApiError, handleApiSuccess } from "@/apiService/apiService";
import {CreateUserOptions, GetByIdUserResponse, GetUsersTableOptions, UserTableRow} from "@/apiService/apiUsers/types";

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
			options?: GetUsersTableOptions;
		}>): Promise<ApiServiceResponse<GetTableResponse<UserTableRow[]>>> => {
			return await api.get("/users/table", {
				signal: options.controller?.signal,
				params: {...options.options},
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
