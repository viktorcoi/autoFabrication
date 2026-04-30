export const isSameFile = (file: File, compareFile: File) => (
    file.name === compareFile.name &&
    file.size === compareFile.size &&
    file.lastModified === compareFile.lastModified &&
    file.type === compareFile.type
);

const normalizeFileName = (name: string) => name.trim().toLowerCase();

export const isSameSavedFile = (
    file: File,
    compareFile: { name: string; size: number },
) => (
    normalizeFileName(file.name) === normalizeFileName(compareFile.name) &&
    file.size === compareFile.size
);

export const getFilesTotalSize = (files: File[]) => files.reduce((total, file) => total + file.size, 0);

export const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';

    const units = ['B', 'KB', 'MB', 'GB'];
    const unitIndex = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
    const value = bytes / (1024 ** unitIndex);

    return `${Number(value.toFixed(value >= 10 ? 0 : 1))} ${units[unitIndex]}`;
};

export const getAcceptItems = (accept?: string | string[]) => {
    if (!accept) return [];

    const items = Array.isArray(accept) ? accept : accept.split(',');

    return items
        .map(item => item.trim().toLowerCase())
        .filter(Boolean);
};

export const isFileAccepted = (file: File, acceptItems: string[]) => {
    if (!acceptItems.length) return true;

    const fileName = file.name.toLowerCase();
    const fileType = file.type.toLowerCase();

    return acceptItems.some(item => {
        if (item.startsWith('.')) {
            return fileName.endsWith(item);
        }

        if (item.endsWith('/*')) {
            return fileType.startsWith(item.slice(0, -1));
        }

        return fileType === item;
    });
};
