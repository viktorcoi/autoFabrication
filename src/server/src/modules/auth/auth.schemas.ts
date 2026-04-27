import { z } from "zod";

export const loginSchema = z.object({
	login: z.string().trim().min(1, "Логин обязателен"),
	password: z.string().min(1, "Пароль обязателен"),
});

export const accessSchema = z.object({
	path: z.preprocess(
		(value) => Array.isArray(value) ? value[0] : value,
		z.string().trim().optional(),
	),
});
