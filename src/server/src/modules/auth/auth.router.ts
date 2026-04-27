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
import { accessSchema, loginSchema } from "./auth.schemas.js";
import { getAuthUserById, loginUser } from "./auth.service.js";

export const authRouter = Router();

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
		const normalizedPath = query.path ? normalizePermissionPath(query.path) : null;
		const protectedPath = normalizedPath && isPermissionRoute(permissions, normalizedPath)
			? normalizedPath
			: null;

		response.json({
			allowed: protectedPath
				? hasPermission(permissions, protectedPath, "view")
				: true,
			isProtectedRoute: Boolean(protectedPath),
		});
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

authRouter.post(
	"/logout",
	asyncHandler(async (_request, response) => {
		response.clearCookie(env.AUTH_COOKIE_NAME, getAuthCookieOptions());

		response.status(204).send();
	}),
);
