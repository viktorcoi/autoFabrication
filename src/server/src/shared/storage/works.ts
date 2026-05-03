import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { env } from "../../config/env.js";
import { AppError } from "../errors/app-error.js";
import { removeStoredFile } from "./avatars.js";

export const WORK_FILE_SIZE_LIMIT = 20 * 1024 * 1024;
export const WORK_FILES_LIMIT = 10;
export const WORK_FILES_TOTAL_SIZE_LIMIT = 100 * 1024 * 1024;

const WORK_STORAGE_DIR_NAME = "works";
const WORK_STORAGE_DIR = path.join(env.UPLOAD_DIR, WORK_STORAGE_DIR_NAME);
const WORK_FILE_MOJIBAKE_PATTERN = /[\u00D0\u00D1]/;
const WORK_FILE_CYRILLIC_PATTERN = /[\u0400-\u04FF]/;

export const normalizeWorkFileOriginalName = (value: string) => {
	const normalizedValue = value.trim();

	if (!normalizedValue || !WORK_FILE_MOJIBAKE_PATTERN.test(normalizedValue)) {
		return normalizedValue || value;
	}

	const decodedValue = Buffer.from(normalizedValue, "latin1").toString("utf8").trim();

	if (!decodedValue || decodedValue.includes("\uFFFD")) {
		return normalizedValue;
	}

	if (WORK_FILE_CYRILLIC_PATTERN.test(decodedValue) || !WORK_FILE_MOJIBAKE_PATTERN.test(decodedValue)) {
		return decodedValue;
	}

	return normalizedValue;
};

const normalizeExtension = (originalName: string) => {
	const extension = path.extname(normalizeWorkFileOriginalName(originalName)).trim();

	if (!extension || extension === ".") {
		return "";
	}

	return extension.slice(0, 32);
};

export const assertWorkFile = (file: Express.Multer.File) => {
	const originalName = normalizeWorkFileOriginalName(file.originalname);

	if (file.size <= 0) {
		throw new AppError(400, `Файл "${originalName}" пустой`);
	}

	if (file.size > WORK_FILE_SIZE_LIMIT) {
		throw new AppError(413, `Размер файла "${originalName}" не должен превышать 20 MB`);
	}
};

export const assertWorkFilesTotalSize = (files: Express.Multer.File[]) => {
	const totalSize = files.reduce((result, file) => result + file.size, 0);

	if (totalSize > WORK_FILES_TOTAL_SIZE_LIMIT) {
		throw new AppError(413, "Общий размер файлов не должен превышать 100 MB");
	}
};

export const saveWorkFiles = async (files: Express.Multer.File[]) => {
	await mkdir(WORK_STORAGE_DIR, { recursive: true });

	const savedFiles = [];

	try {
		for (const file of files) {
			assertWorkFile(file);
			const originalName = normalizeWorkFileOriginalName(file.originalname);
			const fileName = `${randomUUID()}${normalizeExtension(originalName)}`;
			const absolutePath = path.join(WORK_STORAGE_DIR, fileName);
			const storagePath = path.posix.join(WORK_STORAGE_DIR_NAME, fileName);

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

export const getWorkFileAbsolutePath = (storagePath: string) => {
	const normalizedStoragePath = storagePath.replace(/\\/g, "/");
	const absolutePath = path.resolve(env.UPLOAD_DIR, normalizedStoragePath);
	const basePath = path.resolve(WORK_STORAGE_DIR);

	if (!absolutePath.startsWith(`${basePath}${path.sep}`) && absolutePath !== basePath) {
		return null;
	}

	return absolutePath;
};
