import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { env } from "../../config/env.js";
import { AppError } from "../errors/app-error.js";
import { removeStoredFile } from "./avatars.js";

export const PRODUCT_FILE_SIZE_LIMIT = 100 * 1024 * 1024;
export const PRODUCT_FILES_LIMIT = 20;
export const PRODUCT_FILES_TOTAL_SIZE_LIMIT = 200 * 1024 * 1024;
export const PRODUCT_IMAGE_SIZE_LIMIT = 5 * 1024 * 1024;
export const PRODUCT_IMAGES_LIMIT = 20;
export const PRODUCT_IMAGES_TOTAL_SIZE_LIMIT = 100 * 1024 * 1024;
export const PRODUCT_UPLOAD_FILES_LIMIT = PRODUCT_FILES_LIMIT + PRODUCT_IMAGES_LIMIT;

const PRODUCT_STORAGE_DIR_NAME = "products";
const PRODUCT_FILES_STORAGE_DIR_NAME = path.posix.join(PRODUCT_STORAGE_DIR_NAME, "files");
const PRODUCT_IMAGES_STORAGE_DIR_NAME = path.posix.join(PRODUCT_STORAGE_DIR_NAME, "images");
const PRODUCT_FILES_STORAGE_DIR = path.join(env.UPLOAD_DIR, PRODUCT_STORAGE_DIR_NAME, "files");
const PRODUCT_IMAGES_STORAGE_DIR = path.join(env.UPLOAD_DIR, PRODUCT_STORAGE_DIR_NAME, "images");
const PRODUCT_FILE_MOJIBAKE_PATTERN = /[\u00D0\u00D1]/;
const PRODUCT_FILE_CYRILLIC_PATTERN = /[\u0400-\u04FF]/;
const PRODUCT_IMAGE_MIME_EXTENSIONS = {
	"image/jpeg": ".jpg",
	"image/png": ".png",
	"image/webp": ".webp",
} as const;

type ProductImageMimeType = keyof typeof PRODUCT_IMAGE_MIME_EXTENSIONS;

export type SavedProductStoredFile = {
	absolutePath: string;
	storagePath: string;
	originalName: string;
	size: number;
	mimeType: string | null;
};

const isProductImageMimeType = (mimeType: string): mimeType is ProductImageMimeType =>
	Object.prototype.hasOwnProperty.call(PRODUCT_IMAGE_MIME_EXTENSIONS, mimeType);

export const normalizeProductFileOriginalName = (value: string) => {
	const normalizedValue = value.trim();

	if (!normalizedValue || !PRODUCT_FILE_MOJIBAKE_PATTERN.test(normalizedValue)) {
		return normalizedValue || value;
	}

	const decodedValue = Buffer.from(normalizedValue, "latin1").toString("utf8").trim();

	if (!decodedValue || decodedValue.includes("\uFFFD")) {
		return normalizedValue;
	}

	if (PRODUCT_FILE_CYRILLIC_PATTERN.test(decodedValue) || !PRODUCT_FILE_MOJIBAKE_PATTERN.test(decodedValue)) {
		return decodedValue;
	}

	return normalizedValue;
};

const normalizeExtension = (originalName: string) => {
	const extension = path.extname(normalizeProductFileOriginalName(originalName)).trim();

	if (!extension || extension === ".") {
		return "";
	}

	return extension.slice(0, 32);
};

const hasValidImageSignature = (file: Express.Multer.File) => {
	const buffer = file.buffer;

	if (file.mimetype === "image/png") {
		return buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
	}

	if (file.mimetype === "image/jpeg") {
		return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
	}

	if (file.mimetype === "image/webp") {
		return buffer.subarray(0, 4).toString("ascii") === "RIFF" && buffer.subarray(8, 12).toString("ascii") === "WEBP";
	}

	return false;
};

export const assertProductFile = (file: Express.Multer.File) => {
	const originalName = normalizeProductFileOriginalName(file.originalname);

	if (file.size <= 0) {
		throw new AppError(400, `Файл "${originalName}" пустой`);
	}

	if (file.size > PRODUCT_FILE_SIZE_LIMIT) {
		throw new AppError(413, `Размер файла "${originalName}" не должен превышать 100 MB`);
	}
};

export const assertProductImage = (file: Express.Multer.File) => {
	const originalName = normalizeProductFileOriginalName(file.originalname);

	if (!isProductImageMimeType(file.mimetype)) {
		throw new AppError(400, `Изображение "${originalName}" должно быть в формате PNG, JPEG или WEBP`);
	}

	if (file.size <= 0) {
		throw new AppError(400, `Изображение "${originalName}" пустое`);
	}

	if (file.size > PRODUCT_IMAGE_SIZE_LIMIT) {
		throw new AppError(413, `Размер изображения "${originalName}" не должен превышать 5 MB`);
	}

	if (!hasValidImageSignature(file)) {
		throw new AppError(400, `Изображение "${originalName}" не соответствует заявленному формату`);
	}
};

export const assertProductFilesTotalSize = (files: Express.Multer.File[]) => {
	const totalSize = files.reduce((result, file) => result + file.size, 0);

	if (totalSize > PRODUCT_FILES_TOTAL_SIZE_LIMIT) {
		throw new AppError(413, "Общий размер файлов изделия не должен превышать 200 MB");
	}
};

export const assertProductImagesTotalSize = (images: Express.Multer.File[]) => {
	const totalSize = images.reduce((result, file) => result + file.size, 0);

	if (totalSize > PRODUCT_IMAGES_TOTAL_SIZE_LIMIT) {
		throw new AppError(413, "Общий размер изображений изделия не должен превышать 100 MB");
	}
};

const saveProductStoredFiles = async (
	files: Express.Multer.File[],
	storageDir: string,
	storageDirName: string,
	assertFile: (file: Express.Multer.File) => void,
) => {
	await mkdir(storageDir, { recursive: true });

	const savedFiles: SavedProductStoredFile[] = [];

	try {
		for (const file of files) {
			assertFile(file);
			const originalName = normalizeProductFileOriginalName(file.originalname);
			const fileName = `${randomUUID()}${normalizeExtension(originalName)}`;
			const absolutePath = path.join(storageDir, fileName);
			const storagePath = path.posix.join(storageDirName, fileName);

			await writeFile(absolutePath, file.buffer, { flag: "wx" });

			savedFiles.push({
				absolutePath,
				storagePath,
				originalName,
				size: file.size,
				mimeType: file.mimetype || null,
			});
		}

		return savedFiles;
	} catch (error) {
		await Promise.allSettled(savedFiles.map((file) => removeStoredFile(file.absolutePath)));
		throw error;
	}
};

export const saveProductFiles = async (files: Express.Multer.File[]) =>
	saveProductStoredFiles(files, PRODUCT_FILES_STORAGE_DIR, PRODUCT_FILES_STORAGE_DIR_NAME, assertProductFile);

export const saveProductImages = async (images: Express.Multer.File[]) =>
	saveProductStoredFiles(images, PRODUCT_IMAGES_STORAGE_DIR, PRODUCT_IMAGES_STORAGE_DIR_NAME, assertProductImage);

const getProductStoredFileAbsolutePath = (storagePath: string, baseDir: string) => {
	const normalizedStoragePath = storagePath.replace(/\\/g, "/");
	const absolutePath = path.resolve(env.UPLOAD_DIR, normalizedStoragePath);
	const basePath = path.resolve(baseDir);

	if (!absolutePath.startsWith(`${basePath}${path.sep}`) && absolutePath !== basePath) {
		return null;
	}

	return absolutePath;
};

export const getProductFileAbsolutePath = (storagePath: string) =>
	getProductStoredFileAbsolutePath(storagePath, PRODUCT_FILES_STORAGE_DIR);

export const getProductImageAbsolutePath = (storagePath: string) =>
	getProductStoredFileAbsolutePath(storagePath, PRODUCT_IMAGES_STORAGE_DIR);

export const getProductImagePublicPath = (storagePath: string) =>
	`/storage/${storagePath.replace(/\\/g, "/")}`;
