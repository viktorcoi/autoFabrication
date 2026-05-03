import axios from "axios";
import { api } from "@/apiService/apiService";
import {
    PathOperationOptions,
    PathWorkOptions,
    PostOperationOptions,
    PostWorkOptions
} from "@/apiService/apiGuide/types";

const createGuideEntityOptions = (
    options: PostOperationOptions | PathOperationOptions | PostWorkOptions | PathWorkOptions
) => {
    const formData = new FormData();

    if (typeof options.name === "string") {
        formData.append("name", options.name);
    }

    if (typeof options.description === "string") {
        formData.append("description", options.description);
    }

    if ("operationGroupId" in options && typeof options.operationGroupId === "number" && options.operationGroupId > 0) {
        formData.append("operationGroupId", String(options.operationGroupId));
    }

    if ("workGroupId" in options && typeof options.workGroupId === "number" && options.workGroupId > 0) {
        formData.append("workGroupId", String(options.workGroupId));
    }

    if ("tpz" in options && typeof options.tpz === "number") {
        formData.append("tpz", String(options.tpz));
    }

    if ("tsht" in options && typeof options.tsht === "number") {
        formData.append("tsht", String(options.tsht));
    }

    if ("removedFileIds" in options && Array.isArray(options.removedFileIds)) {
        options.removedFileIds.forEach((fileId) => {
            formData.append("removedFileIds", String(fileId));
        });
    }

    if (Array.isArray(options.files)) {
        options.files.forEach((file) => {
            formData.append("files", file);
        });
    }

    return formData;
};

export const createOperationOptions = (options: PostOperationOptions | PathOperationOptions) => {
    return createGuideEntityOptions(options);
};

export const createWorkOptions = (options: PostWorkOptions | PathWorkOptions) => {
    return createGuideEntityOptions(options);
};

const triggerBlobDownload = (blob: Blob, fileName: string) => {
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = objectUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();

    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
};

const sanitizeDownloadFileName = (value: string, fallback: string) => {
    const sanitized = value
        .trim()
        .replace(/[<>:"/\\|?*\u0000-\u001F]/g, "_")
        .replace(/\.+$/g, "")
        .replace(/\s+/g, " ")
        .slice(0, 120);

    return sanitized || fallback;
};

const getBlobErrorMessage = async (data: unknown) => {
    if (!(data instanceof Blob)) {
        return null;
    }

    const text = (await data.text()).trim();

    if (!text) {
        return null;
    }

    try {
        const parsed = JSON.parse(text);

        if (parsed && typeof parsed.message === "string" && parsed.message.trim()) {
            return parsed.message;
        }
    } catch {}

    return text;
};

const getDownloadErrorMessage = async (error: unknown, fallback: string) => {
    if (axios.isAxiosError(error)) {
        const blobMessage = await getBlobErrorMessage(error.response?.data);

        if (blobMessage) {
            return blobMessage;
        }

        if (typeof error.response?.data === "string" && error.response.data.trim()) {
            return error.response.data;
        }

        if (typeof error.message === "string" && error.message.trim()) {
            return error.message;
        }
    }

    return fallback;
};

const getDownloadFileNameFromContentDisposition = (value?: string) => {
    if (!value) {
        return null;
    }

    const utf8Match = value.match(/filename\*\s*=\s*UTF-8''([^;]+)/i);

    if (utf8Match?.[1]) {
        try {
            return decodeURIComponent(utf8Match[1]);
        } catch {}
    }

    const plainMatch = value.match(/filename\s*=\s*"([^"]+)"|filename\s*=\s*([^;]+)/i);
    const fileName = plainMatch?.[1] ?? plainMatch?.[2];

    return fileName?.trim() || null;
};

const getBlobResponse = async (url: string, fallbackErrorText: string) => {
    try {
        return await api.get<Blob>(url, {
            responseType: "blob",
        });
    } catch (error) {
        throw new Error(await getDownloadErrorMessage(error, fallbackErrorText));
    }
};

export const downloadOperationFile = async (fileId: number, fileName: string) => {
    const response = await getBlobResponse(
        `/guide/operation/files/${fileId}/download`,
        "Не удалось скачать файл",
    );
    const fileNameFromHeader = getDownloadFileNameFromContentDisposition(response.headers["content-disposition"]);
    const resolvedFileName = fileNameFromHeader || sanitizeDownloadFileName(fileName, "file");

    triggerBlobDownload(response.data, resolvedFileName);
};

export const downloadOperationFilesArchive = async (operationId: number, operationName: string) => {
    const response = await getBlobResponse(
        `/guide/operation/${operationId}/files/archive`,
        "Не удалось скачать архив",
    );
    const fileNameFromHeader = getDownloadFileNameFromContentDisposition(response.headers["content-disposition"]);
    const archiveFileName = fileNameFromHeader
        || `${sanitizeDownloadFileName(operationName, "operation-files")}.zip`;

    triggerBlobDownload(response.data, archiveFileName);
};

export const downloadWorkFile = async (fileId: number, fileName: string) => {
    const response = await getBlobResponse(
        `/guide/work/files/${fileId}/download`,
        "Не удалось скачать файл",
    );
    const fileNameFromHeader = getDownloadFileNameFromContentDisposition(response.headers["content-disposition"]);
    const resolvedFileName = fileNameFromHeader || sanitizeDownloadFileName(fileName, "file");

    triggerBlobDownload(response.data, resolvedFileName);
};

export const downloadWorkFilesArchive = async (workId: number, workName: string) => {
    const response = await getBlobResponse(
        `/guide/work/${workId}/files/archive`,
        "Не удалось скачать архив",
    );
    const fileNameFromHeader = getDownloadFileNameFromContentDisposition(response.headers["content-disposition"]);
    const archiveFileName = fileNameFromHeader
        || `${sanitizeDownloadFileName(workName, "work-files")}.zip`;

    triggerBlobDownload(response.data, archiveFileName);
};
