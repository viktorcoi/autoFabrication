import {PathUserOptions, PostUserOptions} from "@/apiService/apiUsers/types";

const isFile = (value: unknown): value is File => (
    typeof File !== 'undefined' && value instanceof File
);

export const createUserOptions = (options: PostUserOptions | PathUserOptions) => {
    if (!isFile(options.avatarUrl)) {
        return options;
    }

    const formData = new FormData();

    Object.keys(options).forEach((key) => {
        const dataValue = options[key as keyof (PathUserOptions | PostUserOptions)];

        if (key === 'avatarUrl' && options.avatarUrl) {
            formData.append('avatar', options.avatarUrl);
        } else if (key === 'roleId' && options.roleId) {
            formData.append(key, String(options.roleId));
        } else if (key === 'birthDate' && options.birthDate) {
            formData.append(key, options.birthDate.toISOString());
        } else if (typeof dataValue === 'string') {
            formData.append(key, dataValue);
        }
    });

    return formData;
};
