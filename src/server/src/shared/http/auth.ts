import type { Request } from "express";
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

export const requireAuth = (request: Request) => {
	const token = readAuthToken(request);

	if (!token) {
		throw new AppError(401, "Требуется авторизация");
	}

	return verifyAuthToken(token);
};
