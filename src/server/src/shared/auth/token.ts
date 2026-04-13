import jwt from "jsonwebtoken";
import { env } from "../../config/env.js";
import { AppError } from "../errors/app-error.js";

type AuthTokenPayload = {
	userId: number;
	login: string;
	roleId: number;
};

export const signAuthToken = (payload: AuthTokenPayload) =>
	jwt.sign(payload, env.JWT_SECRET, {
		expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"],
	});

export const verifyAuthToken = (token: string) => {
	try {
		return jwt.verify(token, env.JWT_SECRET) as AuthTokenPayload;
	} catch {
		throw new AppError(401, "Токен недействителен или истек");
	}
};
