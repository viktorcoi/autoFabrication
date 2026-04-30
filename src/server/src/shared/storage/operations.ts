import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { env } from "../../config/env.js";
import { AppError } from "../errors/app-error.js";
import { removeStoredFile } from "./avatars.js";

export const OPERATION_FILE_SIZE_LIMIT = 100 * 1024 * 1024;
export const OPERATION_FILES_LIMIT = 10;
export const OPERATION_FILES_TOTAL_SIZE_LIMIT = 500 * 1024 * 1024;

const OPERATION_STORAGE_DIR_NAME = "operations";
const OPERATION_STORAGE_DIR = path.join(env.UPLOAD_DIR, OPERATION_STORAGE_DIR_NAME);

const normalizeExtension = (originalName: string) => {
	const extension = path.extname(originalName).trim();

	if (!extension || extension === ".") {
		return "";
	}

	return extension.slice(0, 32);
};

export const assertOperationFile = (file: Express.Multer.File) => {
	if (file.size <= 0) {
		throw new AppError(400, `Файл "${file.originalname}" пустой`);
	}

	if (file.size > OPERATION_FILE_SIZE_LIMIT) {
		throw new AppError(413, `Размер файла "${file.originalname}" не должен превышать 100 MB`);
	}
};

export const assertOperationFilesTotalSize = (files: Express.Multer.File[]) => {
	const totalSize = files.reduce((result, file) => result + file.size, 0);

	if (totalSize > OPERATION_FILES_TOTAL_SIZE_LIMIT) {
		throw new AppError(413, "Общий размер файлов не должен превышать 500 MB");
	}
};

export const saveOperationFiles = async (files: Express.Multer.File[]) => {
	await mkdir(OPERATION_STORAGE_DIR, { recursive: true });

	const savedFiles = [];

	try {
		for (const file of files) {
			assertOperationFile(file);

			const fileName = `${randomUUID()}${normalizeExtension(file.originalname)}`;
			const absolutePath = path.join(OPERATION_STORAGE_DIR, fileName);
			const storagePath = path.posix.join(OPERATION_STORAGE_DIR_NAME, fileName);

			await writeFile(absolutePath, file.buffer, { flag: "wx" });

			savedFiles.push({
				absolutePath,
				storagePath,
				originalName: file.originalname,
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

export const getOperationFileAbsolutePath = (storagePath: string) => {
	const normalizedStoragePath = storagePath.replace(/\\/g, "/");
	const absolutePath = path.resolve(env.UPLOAD_DIR, normalizedStoragePath);
	const basePath = path.resolve(OPERATION_STORAGE_DIR);

	if (!absolutePath.startsWith(`${basePath}${path.sep}`) && absolutePath !== basePath) {
		return null;
	}

	return absolutePath;
};
