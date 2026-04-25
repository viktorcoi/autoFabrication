import type { NextFunction, Request, Response } from "express";
import { Router } from "express";
import multer from "multer";
import { AppError } from "../../shared/errors/app-error.js";
import { asyncHandler } from "../../shared/http/async-handler.js";
import { requireAuth } from "../../shared/http/auth.js";
import { requirePermission } from "../../shared/http/permissions.js";
import { validate } from "../../shared/http/validate.js";
import {
	AVATAR_FILE_SIZE_LIMIT,
	getPublicStorageUrl,
	getStoredAvatarAbsolutePath,
	removeStoredFile,
	saveAvatarFile,
} from "../../shared/storage/avatars.js";
import { createUserSchema, deleteUserIdsSchema, getUsersTableSchema, updateUserSchema } from "./user.schemas.js";
import { createUser, deleteUsers, getUserById, getUsersTable, listUsers, updateUser } from "./user.service.js";

const parseId = (value: string) => {
	const id = Number.parseInt(value, 10);

	if (!Number.isInteger(id) || id <= 0) {
		throw new AppError(400, "Некорректный id пользователя");
	}

	return id;
};

export const userRouter = Router();

const avatarUpload = multer({
	storage: multer.memoryStorage(),
	limits: {
		fileSize: AVATAR_FILE_SIZE_LIMIT,
		files: 1,
	},
});

const parseAvatarUpload = (request: Request, response: Response, next: NextFunction) => {
	avatarUpload.single("avatar")(request, response, (error) => {
		if (!error) {
			next();
			return;
		}

		if (error instanceof multer.MulterError) {
			if (error.code === "LIMIT_FILE_SIZE") {
				next(new AppError(413, "Размер аватара не должен превышать 5 MB"));
				return;
			}

			next(new AppError(400, "Не удалось загрузить аватар"));
			return;
		}

		next(error);
	});
};

userRouter.get(
	"/",
	requirePermission("/users", "view"),
	asyncHandler(async (_request, response) => {
		const users = await listUsers();

		response.json(users);
	}),
);

userRouter.get(
	"/table",
	requirePermission("/users", "view"),
	asyncHandler(async (request, response) => {
		const query = validate(getUsersTableSchema, request.query);
		const table = await getUsersTable(query);

		response.json(table);
	}),
);

userRouter.get(
	"/:id",
	requirePermission("/users", "view"),
	asyncHandler(async (request, response) => {
		const user = await getUserById(parseId(String(request.params.id)));

		response.json(user);
	}),
);

userRouter.post(
	"/",
	requirePermission("/users", "adding"),
	parseAvatarUpload,
	asyncHandler(async (request, response) => {
		const payload = validate(createUserSchema, request.body ?? {});
		const avatarFile = request.file;
		let savedAvatar: Awaited<ReturnType<typeof saveAvatarFile>> | null = null;

		try {
			if (avatarFile) {
				savedAvatar = await saveAvatarFile(avatarFile);
			}

			const user = await createUser({
				...payload,
				...(savedAvatar ? { avatarUrl: getPublicStorageUrl(request, savedAvatar.publicPath) } : {}),
			});

			response.status(201).json(user);
		} catch (error) {
			if (savedAvatar) {
				await removeStoredFile(savedAvatar.absolutePath);
			}

			throw error;
		}
	}),
);

userRouter.delete(
	"/",
	requirePermission("/users", "view"),
	asyncHandler(async (request, response) => {
		const auth = requireAuth(request, response);
		const payload = validate(deleteUserIdsSchema, request.body ?? []);
		const result = await deleteUsers(payload, auth.userId);

		response.json(result);
	}),
);

userRouter.patch(
	"/:id",
	requirePermission("/users", "editing"),
	parseAvatarUpload,
	asyncHandler(async (request, response) => {
		const userId = parseId(String(request.params.id));
		const currentUser = await getUserById(userId);
		const payload = validate(updateUserSchema, request.body ?? {});
		const avatarFile = request.file;
		const previousAvatarAbsolutePath = currentUser.avatarUrl
			? getStoredAvatarAbsolutePath(currentUser.avatarUrl)
			: null;
		let savedAvatar: Awaited<ReturnType<typeof saveAvatarFile>> | null = null;

		try {
			if (avatarFile) {
				savedAvatar = await saveAvatarFile(avatarFile);
			}

			const user = await updateUser(userId, {
				...payload,
				...(savedAvatar ? { avatarUrl: getPublicStorageUrl(request, savedAvatar.publicPath) } : {}),
			});
			const shouldRemovePreviousAvatar = Boolean(savedAvatar)
				|| payload.avatarUrl === null
				|| (typeof payload.avatarUrl === "string" && payload.avatarUrl !== currentUser.avatarUrl);

			if (shouldRemovePreviousAvatar && previousAvatarAbsolutePath) {
				await removeStoredFile(previousAvatarAbsolutePath);
			}

			response.json(user);
		} catch (error) {
			if (savedAvatar) {
				await removeStoredFile(savedAvatar.absolutePath);
			}

			throw error;
		}
	}),
);
