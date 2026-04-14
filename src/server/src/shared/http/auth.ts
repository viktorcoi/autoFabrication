import type { Request, Response } from "express";
import { parse } from "cookie";
import { env } from "../../config/env.js";
import { AppError } from "../errors/app-error.js";
import { verifyAuthToken } from "../auth/token.js";

export const readAuthToken = (request: Request) => {
	const authHeader = request.headers.authorization;

	if (authHeader?.startsWith("Bearer ")) {
		return authHeader.slice(7);
	}

	const cookies = parse(request.headers.cookie ?? "");
	return cookies[env.AUTH_COOKIE_NAME];
};

export const clearAuthCookie = (response: Response) => {
	response.clearCookie(env.AUTH_COOKIE_NAME, {
		httpOnly: true,
		sameSite: "lax",
		secure: false,
		path: "/",
	});
};

export const requireAuth = (
	request: Request,
	response: Response
) => {
	const token = readAuthToken(request);

	if (!token) {
		throw new AppError(401, "Требуется авторизация");
	}

	try {
		return verifyAuthToken(token);
	} catch (error) {
		clearAuthCookie(response);
		throw error;
	}
};
