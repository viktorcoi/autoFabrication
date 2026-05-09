import type { NextFunction, Request, Response } from "express";
import { Router } from "express";
import multer from "multer";
import { AppError } from "../../shared/errors/app-error.js";
import { asyncHandler } from "../../shared/http/async-handler.js";
import { requireAuth } from "../../shared/http/auth.js";
import { assertPermission, hasPermission, loadRolePermissions, requirePermission } from "../../shared/http/permissions.js";
import { validate } from "../../shared/http/validate.js";
import {
	AVATAR_FILE_SIZE_LIMIT,
	getPublicStorageUrl,
	getStoredAvatarAbsolutePath,
	removeStoredFile,
	saveAvatarFile,
} from "../../shared/storage/avatars.js";
import {
	createUserSchema,
	deleteUserIdsSchema,
	getUsersSchema,
	getUsersTableSchema,
	updateUsersTableSchema,
	updateUserSchema,
} from "./user.schemas.js";
import {
	createUser,
	deleteUsers,
	getUserById,
	getUsersTable,
	listUsers,
	updateUsersTable,
	updateUser,
} from "./user.service.js";

const parseId = (value: string) => {
	const id = Number.parseInt(value, 10);

	if (!Number.isInteger(id) || id <= 0) {
		throw new AppError(400, "Некорректный id пользователя");
	}

	return id;
};

export const userRouter = Router();

const PRODUCTS_FOR_SELECT_PERMISSIONS = [
	"view",
	"adding",
	"editing",
	"viewProcess",
	"addingProcess",
	"editingProcess",
] as const;

const canReadUsersForSelect = (permissions: Awaited<ReturnType<typeof loadRolePermissions>>) =>
	hasPermission(permissions, "/users", "view")
	|| hasPermission(permissions, "/users", "adding")
	|| hasPermission(permissions, "/users", "editing")
	|| PRODUCTS_FOR_SELECT_PERMISSIONS.some((permission) => hasPermission(permissions, "/products", permission));

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

const requireResetPasswordPermissionIfNeeded = async (
	request: Request,
	response: Response,
	next: NextFunction,
) => {
	try {
		const hasPasswordKey = (
			typeof request.body === "object"
			&& request.body !== null
			&& Object.prototype.hasOwnProperty.call(request.body, "password")
		);

		if (!hasPasswordKey) {
			next();
			return;
		}

		const permissions = await loadRolePermissions(request, response);
		assertPermission(permissions, "/users", "resetPassword");
		next();
	} catch (error) {
		next(error);
	}
};

userRouter.get(
	"/",
	asyncHandler(async (request, response) => {
		const permissions = await loadRolePermissions(request, response);
		const forSelect = request.query.forSelect === "true";

		if (forSelect) {
			if (!canReadUsersForSelect(permissions)) {
				throw new AppError(403, "У вас отсутствует доступ для данного действия");
			}
		} else {
			assertPermission(permissions, "/users", "view");
		}

		const query = validate(getUsersSchema, request.query);
		const users = await listUsers(query);

		response.json(users);
	}),
);

userRouter.get(
	"/table",
	requirePermission("/users", "view"),
	asyncHandler(async (request, response) => {
		const auth = requireAuth(request, response);
		const query = validate(getUsersTableSchema, request.query);
		const table = await getUsersTable(query, auth.userId);

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
	"/table",
	requirePermission("/users", "view"),
	asyncHandler(async (request, response) => {
		const auth = requireAuth(request, response);
		const payload = validate(updateUsersTableSchema, request.body ?? {});
		const result = await updateUsersTable(payload, auth.userId);

		response.json(result);
	}),
);

userRouter.patch(
	"/:id",
	requirePermission("/users", "editing"),
	parseAvatarUpload,
	requireResetPasswordPermissionIfNeeded,
	asyncHandler(async (request, response) => {
		const auth = requireAuth(request, response);
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
			}, auth.userId);
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
