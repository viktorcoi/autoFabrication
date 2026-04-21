import {ApiServiceOptions, ApiServiceResponse, GetTableResponse} from "@/apiService/types";
import { api, handleApiError, handleApiSuccess } from "@/apiService/apiService";
import {GetUsersTableOptions, UserTableRow} from "@/apiService/apiUsers/types";

export const ApiUsers = {
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
