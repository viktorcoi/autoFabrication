import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { env } from "../../config/env.js";
import { AppError } from "../errors/app-error.js";
import { removeStoredFile } from "./avatars.js";

export const PROCESS_FILE_SIZE_LIMIT = 100 * 1024 * 1024;
export const PROCESS_FILES_LIMIT = 20;
export const PROCESS_FILES_TOTAL_SIZE_LIMIT = 200 * 1024 * 1024;

const PROCESS_STORAGE_DIR_NAME = "processes";
const PROCESS_STORAGE_DIR = path.join(env.UPLOAD_DIR, PROCESS_STORAGE_DIR_NAME);
const PROCESS_FILE_MOJIBAKE_PATTERN = /[\u00D0\u00D1]/;
const PROCESS_FILE_CYRILLIC_PATTERN = /[\u0400-\u04FF]/;

export const normalizeProcessFileOriginalName = (value: string) => {
	const normalizedValue = value.trim();

	if (!normalizedValue || !PROCESS_FILE_MOJIBAKE_PATTERN.test(normalizedValue)) {
		return normalizedValue || value;
	}

	const decodedValue = Buffer.from(normalizedValue, "latin1").toString("utf8").trim();

	if (!decodedValue || decodedValue.includes("\uFFFD")) {
		return normalizedValue;
	}

	if (PROCESS_FILE_CYRILLIC_PATTERN.test(decodedValue) || !PROCESS_FILE_MOJIBAKE_PATTERN.test(decodedValue)) {
		return decodedValue;
	}

	return normalizedValue;
};

const normalizeExtension = (originalName: string) => {
	const extension = path.extname(normalizeProcessFileOriginalName(originalName)).trim();

	if (!extension || extension === ".") {
		return "";
	}

	return extension.slice(0, 32);
};

export const assertProcessFile = (file: Express.Multer.File) => {
	const originalName = normalizeProcessFileOriginalName(file.originalname);

	if (file.size <= 0) {
		throw new AppError(400, `Файл "${originalName}" пустой`);
	}

	if (file.size > PROCESS_FILE_SIZE_LIMIT) {
		throw new AppError(413, `Размер файла "${originalName}" не должен превышать 100 MB`);
	}
};

export const assertProcessFilesTotalSize = (files: Express.Multer.File[]) => {
	const totalSize = files.reduce((result, file) => result + file.size, 0);

	if (totalSize > PROCESS_FILES_TOTAL_SIZE_LIMIT) {
		throw new AppError(413, "Общий размер файлов техпроцесса не должен превышать 200 MB");
	}
};

export const saveProcessFiles = async (files: Express.Multer.File[]) => {
	await mkdir(PROCESS_STORAGE_DIR, { recursive: true });

	const savedFiles = [];

	try {
		for (const file of files) {
			assertProcessFile(file);
			const originalName = normalizeProcessFileOriginalName(file.originalname);
			const fileName = `${randomUUID()}${normalizeExtension(originalName)}`;
			const absolutePath = path.join(PROCESS_STORAGE_DIR, fileName);
			const storagePath = path.posix.join(PROCESS_STORAGE_DIR_NAME, fileName);

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

export const getProcessFileAbsolutePath = (storagePath: string) => {
	const normalizedStoragePath = storagePath.replace(/\\/g, "/");
	const absolutePath = path.resolve(env.UPLOAD_DIR, normalizedStoragePath);
	const basePath = path.resolve(PROCESS_STORAGE_DIR);

	if (!absolutePath.startsWith(`${basePath}${path.sep}`) && absolutePath !== basePath) {
		return null;
	}

	return absolutePath;
};
