import axios from "axios";
import {api} from "@/apiService/apiService";
import {PatchProcessOperationOptions} from "@/apiService/apiProcessOperations/types";

export const createProcessOperationOptions = (options: PatchProcessOperationOptions) => {
    const formData = new FormData();

    if (typeof options.exit === "number" && options.exit >= 0) {
        formData.append("exit", String(options.exit));
    } else if (options.exit === null) {
        formData.append("exit", "null");
    }

    if (typeof options.description === "string") {
        formData.append("description", options.description);
    }

    if (Array.isArray(options.removedFileIds)) {
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

export const downloadProcessOperationFile = async (fileId: number, fileName: string) => {
    const response = await getBlobResponse(
        `/process-operations/files/${fileId}/download`,
        "Не удалось скачать файл",
    );
    const fileNameFromHeader = getDownloadFileNameFromContentDisposition(response.headers["content-disposition"]);
    const resolvedFileName = fileNameFromHeader || sanitizeDownloadFileName(fileName, "file");

    triggerBlobDownload(response.data, resolvedFileName);
};

export const downloadProcessOperationFilesArchive = async (processOperationId: number, operationName: string) => {
    const response = await getBlobResponse(
        `/process-operations/${processOperationId}/files/archive`,
        "Не удалось скачать архив",
    );
    const fileNameFromHeader = getDownloadFileNameFromContentDisposition(response.headers["content-disposition"]);
    const archiveFileName = fileNameFromHeader
        || `${sanitizeDownloadFileName(operationName, "process-operation-files")}.zip`;

    triggerBlobDownload(response.data, archiveFileName);
};
