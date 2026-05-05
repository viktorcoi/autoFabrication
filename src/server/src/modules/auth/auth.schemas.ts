import { z } from "zod";

export const loginSchema = z.object({
	login: z.string().trim().min(1, "Логин обязателен"),
	password: z.string().min(1, "Пароль обязателен"),
});

const passwordSchema = z
	.string()
	.min(6, "Пароль должен содержать не менее 6 символов.")
	.max(15, "Пароль должен быть не более 15 символов");

export const changePasswordSchema = z.object({
	oldPassword: z.string().min(1, "Текущий пароль обязателен"),
	newPassword: passwordSchema,
});

export const accessSchema = z.object({
	path: z.preprocess(
		(value) => Array.isArray(value) ? value[0] : value,
		z.string().trim().optional(),
	),
});
