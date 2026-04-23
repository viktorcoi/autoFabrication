import {ApiServiceOptions, ApiServiceResponse, GetTableOptions, GetTableResponse} from "@/apiService/types";
import {api, buildTableOptions, handleApiError, handleApiSuccess} from "@/apiService/apiService";
import {CreateUserOptions, GetByIdUserResponse, UserTableRow} from "@/apiService/apiUsers/types";

const isFile = (value: unknown): value is File => (
	typeof File !== 'undefined' && value instanceof File
);

const buildCreateUserPayload = (options: CreateUserOptions) => {
	if (!isFile(options.avatarUrl)) {
		return options;
	}

	const formData = new FormData();

	formData.append('roleId', String(options.roleId));
	formData.append('firstName', options.firstName);
	formData.append('lastName', options.lastName);
	formData.append('birthDate', options.birthDate.toISOString());
	formData.append('login', options.login);
	formData.append('password', options.password);
	formData.append('avatar', options.avatarUrl);

	if (options.middleName?.trim()) {
		formData.append('middleName', options.middleName);
	}

	return formData;
};

export const ApiUsers = {
	post: async (options: ApiServiceOptions<{
		options: CreateUserOptions;
	}>): Promise<ApiServiceResponse<GetByIdUserResponse>> => {
		return await api.post("/users",
			buildCreateUserPayload(options.options),
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
