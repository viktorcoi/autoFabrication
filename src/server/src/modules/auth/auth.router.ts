import { Router } from "express";
import { env } from "../../config/env.js";
import { signAuthToken } from "../../shared/auth/token.js";
import { asyncHandler } from "../../shared/http/async-handler.js";
import {
	AUTH_COOKIE_MAX_AGE_MS,
	getAuthCookieOptions,
	requireAuth,
} from "../../shared/http/auth.js";
import {
	hasPermission,
	isPermissionRoute,
	loadRolePermissions,
	normalizePermissionPath,
} from "../../shared/http/permissions.js";
import { validate } from "../../shared/http/validate.js";
import { accessSchema, changePasswordSchema, loginSchema } from "./auth.schemas.js";
import { changeAuthUserPassword, getAuthUserById, loginUser } from "./auth.service.js";

export const authRouter = Router();

const getRouteAccess = (
	permissions: Awaited<ReturnType<typeof loadRolePermissions>>,
	path: string | null,
) => {
	if (!path) {
		return {
			allowed: true,
			isProtectedRoute: false,
		};
	}

	if (/^\/products\/edit\/[^/]+\/?$/.test(path)) {
		return {
			allowed: hasPermission(permissions, "/products", "editing"),
			isProtectedRoute: true,
		};
	}

	if (/^\/products\/[^/]+\/process(?:\/.*)?\/?$/.test(path)) {
		return {
			allowed: hasPermission(permissions, "/products", "viewProcess"),
			isProtectedRoute: true,
		};
	}

	const normalizedPath = normalizePermissionPath(path);
	const protectedPath = isPermissionRoute(permissions, normalizedPath)
		? normalizedPath
		: null;

	return {
		allowed: protectedPath
			? hasPermission(permissions, protectedPath, "view")
			: true,
		isProtectedRoute: Boolean(protectedPath),
	};
};

authRouter.post(
	"/login",
	asyncHandler(async (request, response) => {
		const payload = validate(loginSchema, request.body);
		const user = await loginUser(payload.login, payload.password);
		const token = signAuthToken({
			userId: user.id,
			login: user.login,
			roleId: user.roleId,
		});

		response.cookie(env.AUTH_COOKIE_NAME, token, getAuthCookieOptions(AUTH_COOKIE_MAX_AGE_MS));

		response.json({ ...user });
	}),
);

authRouter.get(
	"/access",
	asyncHandler(async (request, response) => {
		requireAuth(request, response);
		const permissions = await loadRolePermissions(request, response);
		const query = validate(accessSchema, request.query);
		const access = getRouteAccess(permissions, query.path ?? null);

		response.json(access);
	}),
);

authRouter.get(
	"/me",
	asyncHandler(async (request, response) => {
		const auth = requireAuth(request, response);
		const user = await getAuthUserById(auth.userId);

		response.json({
			...user,
		});
	}),
);

authRouter.patch(
	"/password",
	asyncHandler(async (request, response) => {
		const auth = requireAuth(request, response);
		const payload = validate(changePasswordSchema, request.body ?? {});

		await changeAuthUserPassword(auth.userId, payload.oldPassword, payload.newPassword);

		response.status(204).send();
	}),
);

authRouter.post(
	"/logout",
	asyncHandler(async (_request, response) => {
		response.clearCookie(env.AUTH_COOKIE_NAME, getAuthCookieOptions());

		response.status(204).send();
	}),
);
