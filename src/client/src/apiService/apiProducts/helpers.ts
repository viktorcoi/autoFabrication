import {
    PathProductOptions,
    PostProductOptions,
    ProductsDateRangeFilter
} from "@/apiService/apiProducts/types";
import axios from "axios";
import {api} from "@/apiService/apiService";

const padDatePart = (value: number) => String(value).padStart(2, "0");

export const formatProductFilterDate = (date: Date | null) => {
    if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
        return undefined;
    }

    return [
        date.getFullYear(),
        padDatePart(date.getMonth() + 1),
        padDatePart(date.getDate()),
    ].join("-");
};

export const getProductDateRangeParams = (range?: ProductsDateRangeFilter) => {
    if (!range) {
        return {};
    }

    const [from, to] = range;

    return {
        ...(from ? {createdAtFrom: formatProductFilterDate(from)} : undefined),
        ...(to ? {createdAtTo: formatProductFilterDate(to)} : undefined),
    };
};

export const createProductOptions = (options: PostProductOptions | PathProductOptions) => {
    const formData = new FormData();

    if (typeof options.name === "string") {
        formData.append("name", options.name);
    }

    if (typeof options.description === "string") {
        formData.append("description", options.description);
    }

    if (typeof options.typeProductId === "number" && options.typeProductId > 0) {
        formData.append("typeProductId", String(options.typeProductId));
    }

    if (typeof options.materialId === "number" && options.materialId > 0) {
        formData.append("materialId", String(options.materialId));
    } else if (options.materialId === null) {
        formData.append("materialId", "null");
    }

    if (Array.isArray(options.relatedProducts)) {
        formData.append("relatedProducts", JSON.stringify(options.relatedProducts));
    }

    if ("removedFileIds" in options && Array.isArray(options.removedFileIds)) {
        options.removedFileIds.forEach((fileId) => {
            formData.append("removedFileIds", String(fileId));
        });
    }

    if ("removedImageIds" in options && Array.isArray(options.removedImageIds)) {
        options.removedImageIds.forEach((imageId) => {
            formData.append("removedImageIds", String(imageId));
        });
    }

    if (Array.isArray(options.files)) {
        options.files.forEach((file) => {
            formData.append("files", file);
        });
    }

    if (Array.isArray(options.images)) {
        options.images.forEach((image) => {
            formData.append("images", image);
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

export const downloadProductFile = async (fileId: number, fileName: string) => {
    const response = await getBlobResponse(
        `/products/files/${fileId}/download`,
        "Не удалось скачать файл",
    );
    const fileNameFromHeader = getDownloadFileNameFromContentDisposition(response.headers["content-disposition"]);
    const resolvedFileName = fileNameFromHeader || sanitizeDownloadFileName(fileName, "file");

    triggerBlobDownload(response.data, resolvedFileName);
};

export const downloadProductFilesArchive = async (productId: number, productName: string) => {
    const response = await getBlobResponse(
        `/products/${productId}/files/archive`,
        "Не удалось скачать архив",
    );
    const fileNameFromHeader = getDownloadFileNameFromContentDisposition(response.headers["content-disposition"]);
    const archiveFileName = fileNameFromHeader
        || `${sanitizeDownloadFileName(productName, "product-files")}.zip`;

    triggerBlobDownload(response.data, archiveFileName);
};
