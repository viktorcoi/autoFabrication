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
	GetByIdUserResponse,
	GetUsersOptions,
	GetUsersResponse,
	GetUsersTableFilters,
	PatchUsersTableOptions,
	PathUserOptions,
	PostUserOptions,
	UserTableRow,
} from "@/apiService/apiUsers/types";
import {createUserOptions} from "@/apiService/apiUsers/helpers";

export const ApiUsers = {
	get: async (options: ApiServiceOptions<{
		options?: GetListOptions<GetUsersOptions>;
	}> = {}): Promise<ApiServiceResponse<GetUsersResponse[]>> => {
		return await api.get("/users", {
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
	}>): Promise<ApiServiceResponse<GetByIdUserResponse>> => {
		return await api.get(`/users/${options.id}`, {
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
		options: PostUserOptions;
	}>): Promise<ApiServiceResponse<GetByIdUserResponse>> => {
		return await api.post("/users",
			createUserOptions(options.options),
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
		options: PathUserOptions;
	}>): Promise<ApiServiceResponse<GetByIdUserResponse>> => {
		return await api.patch(`/users/${options.id}`,
			createUserOptions(options.options),
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
		return await api.delete("/users", {
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
			options?: GetTableOptions<Partial<GetUsersTableFilters>>;
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

		patch: async (options: ApiServiceOptions<{
			options: PatchUsersTableOptions;
		}>): Promise<ApiServiceResponse<ActionByTableResponse>> => {
			return await api.patch("/users/table",
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
};
