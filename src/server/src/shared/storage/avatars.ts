import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import type { Request } from "express";
import { env } from "../../config/env.js";
import { AppError } from "../errors/app-error.js";

export const AVATAR_FILE_SIZE_LIMIT = 5 * 1024 * 1024;

const AVATAR_STORAGE_DIR_NAME = "avatars";
const AVATAR_PUBLIC_DIR = "/storage/avatars";
const AVATAR_MIME_EXTENSIONS = {
	"image/jpeg": ".jpg",
	"image/png": ".png",
	"image/webp": ".webp",
} as const;

type AvatarMimeType = keyof typeof AVATAR_MIME_EXTENSIONS;

const isAvatarMimeType = (mimeType: string): mimeType is AvatarMimeType =>
	Object.prototype.hasOwnProperty.call(AVATAR_MIME_EXTENSIONS, mimeType);

const hasValidSignature = (file: Express.Multer.File) => {
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

export const assertAvatarFile = (file: Express.Multer.File) => {
	if (!isAvatarMimeType(file.mimetype)) {
		throw new AppError(400, "Аватар должен быть в формате PNG, JPEG или WEBP");
	}

	if (file.size <= 0) {
		throw new AppError(400, "Файл аватара пустой");
	}

	if (file.size > AVATAR_FILE_SIZE_LIMIT) {
		throw new AppError(413, "Размер аватара не должен превышать 5 MB");
	}

	if (!hasValidSignature(file)) {
		throw new AppError(400, "Файл аватара не соответствует заявленному формату");
	}
};

export const saveAvatarFile = async (file: Express.Multer.File) => {
	assertAvatarFile(file);

	const avatarsDir = path.join(env.UPLOAD_DIR, AVATAR_STORAGE_DIR_NAME);
	await mkdir(avatarsDir, { recursive: true });

	if (!isAvatarMimeType(file.mimetype)) {
		throw new AppError(400, "Аватар должен быть в формате PNG, JPEG или WEBP");
	}

	const extension = AVATAR_MIME_EXTENSIONS[file.mimetype];
	const fileName = `${randomUUID()}${extension}`;
	const absolutePath = path.join(avatarsDir, fileName);
	const publicPath = `${AVATAR_PUBLIC_DIR}/${fileName}`;

	await writeFile(absolutePath, file.buffer, { flag: "wx" });

	return {
		absolutePath,
		publicPath,
	};
};

export const removeStoredFile = async (absolutePath: string) => {
	try {
		await unlink(absolutePath);
	} catch (error) {
		if (!(error && typeof error === "object" && "code" in error && error.code === "ENOENT")) {
			throw error;
		}
	}
};

export const getStoredAvatarAbsolutePath = (avatarUrl: string) => {
	try {
		const avatarPathname = new URL(avatarUrl, "http://localhost").pathname;

		if (!avatarPathname.startsWith(`${AVATAR_PUBLIC_DIR}/`)) {
			return null;
		}

		const fileName = path.posix.basename(avatarPathname);

		if (!fileName || fileName === "." || fileName === "..") {
			return null;
		}

		return path.join(env.UPLOAD_DIR, AVATAR_STORAGE_DIR_NAME, fileName);
	} catch {
		return null;
	}
};

export const getPublicStorageUrl = (request: Request, publicPath: string) =>
	`${request.protocol}://${request.get("host") ?? "localhost"}${publicPath}`;
