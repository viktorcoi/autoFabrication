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
		throw new AppError(400, "ÐÐ²Ð°Ñ‚Ð°Ñ€ Ð´Ð¾Ð»Ð¶ÐµÐ½ Ð±Ñ‹Ñ‚ÑŒ Ð² Ñ„Ð¾Ñ€Ð¼Ð°Ñ‚Ðµ PNG, JPEG Ð¸Ð»Ð¸ WEBP");
	}

	if (file.size <= 0) {
		throw new AppError(400, "Ð¤Ð°Ð¹Ð» Ð°Ð²Ð°Ñ‚Ð°Ñ€Ð° Ð¿ÑƒÑÑ‚Ð¾Ð¹");
	}

	if (file.size > AVATAR_FILE_SIZE_LIMIT) {
		throw new AppError(413, "Ð Ð°Ð·Ð¼ÐµÑ€ Ð°Ð²Ð°Ñ‚Ð°Ñ€Ð° Ð½Ðµ Ð´Ð¾Ð»Ð¶ÐµÐ½ Ð¿Ñ€ÐµÐ²Ñ‹ÑˆÐ°Ñ‚ÑŒ 5 MB");
	}

	if (!hasValidSignature(file)) {
		throw new AppError(400, "Ð¤Ð°Ð¹Ð» Ð°Ð²Ð°Ñ‚Ð°Ñ€Ð° Ð½Ðµ ÑÐ¾Ð¾Ñ‚Ð²ÐµÑ‚ÑÑ‚Ð²ÑƒÐµÑ‚ Ð·Ð°ÑÐ²Ð»ÐµÐ½Ð½Ð¾Ð¼Ñƒ Ñ„Ð¾Ñ€Ð¼Ð°Ñ‚Ñƒ");
	}
};

export const saveAvatarFile = async (file: Express.Multer.File) => {
	assertAvatarFile(file);

	const avatarsDir = path.join(env.UPLOAD_DIR, AVATAR_STORAGE_DIR_NAME);
	await mkdir(avatarsDir, { recursive: true });

	if (!isAvatarMimeType(file.mimetype)) {
		throw new AppError(400, "ÐÐ²Ð°Ñ‚Ð°Ñ€ Ð´Ð¾Ð»Ð¶ÐµÐ½ Ð±Ñ‹Ñ‚ÑŒ Ð² Ñ„Ð¾Ñ€Ð¼Ð°Ñ‚Ðµ PNG, JPEG Ð¸Ð»Ð¸ WEBP");
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

export const getPublicStorageUrl = (request: Request, publicPath: string) =>
	`${request.protocol}://${request.get("host") ?? "localhost"}${publicPath}`;
