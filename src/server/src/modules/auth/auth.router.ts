import { Router } from "express";
import { env } from "../../config/env.js";
import { asyncHandler } from "../../shared/http/async-handler.js";
import { validate } from "../../shared/http/validate.js";
import { requireAuth } from "../../shared/http/auth.js";
import { signAuthToken } from "../../shared/auth/token.js";
import { loginSchema } from "./auth.schemas.js";
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

		response.cookie(env.AUTH_COOKIE_NAME, token, {
			httpOnly: true,
			sameSite: "lax",
			secure: false,
			path: "/",
			maxAge: 7 * 24 * 60 * 60 * 1000,
		});

		response.json({
			token,
			user,
		});
	}),
);

authRouter.get(
	"/me",
	asyncHandler(async (request, response) => {
		const auth = requireAuth(request);
		const user = await getAuthUserById(auth.userId);

		response.json({
			...user,
		});
	}),
);

authRouter.post(
	"/logout",
	asyncHandler(async (_request, response) => {
		response.clearCookie(env.AUTH_COOKIE_NAME, {
			httpOnly: true,
			sameSite: "lax",
			secure: false,
			path: "/",
		});

		response.status(204).send();
	}),
);
