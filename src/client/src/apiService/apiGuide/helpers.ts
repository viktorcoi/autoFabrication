import {api} from "@/apiService/apiService";
import {PathOperationOptions, PostOperationOptions} from "@/apiService/apiGuide/types";

export const createOperationOptions = (options: PostOperationOptions | PathOperationOptions) => {
    const formData = new FormData();

    if (typeof options.name === 'string') {
        formData.append('name', options.name);
    }

    if (typeof options.description === 'string') {
        formData.append('description', options.description);
    }

    if (typeof options.operationGroupId === 'number' && options.operationGroupId > 0) {
        formData.append('operationGroupId', String(options.operationGroupId));
    }

    if ('removedFileIds' in options && Array.isArray(options.removedFileIds)) {
        options.removedFileIds.forEach((fileId) => {
            formData.append('removedFileIds', String(fileId));
        });
    }

    if (Array.isArray(options.files)) {
        options.files.forEach((file) => {
            formData.append('files', file);
        });
    }

    return formData;
};

export const downloadOperationFile = async (fileId: number, fileName: string) => {
    const response = await fetch(api.getUri({
        url: `/guide/operation/files/${fileId}/download`
    }), {
        credentials: 'include',
    });

    if (!response.ok) {
        let message = 'Не удалось скачать файл';

        try {
            const data = await response.json();

            if (data && typeof data.message === 'string' && data.message.trim()) {
                message = data.message;
            }
        } catch {}

        throw new Error(message);
    }

    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = objectUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();

    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
};
