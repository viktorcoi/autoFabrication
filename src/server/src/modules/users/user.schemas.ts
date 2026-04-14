import { z } from "zod";

const passwordSchema = z
	.string()
	.min(6, "Пароль должен содержать минимум 6 символов")
	.regex(/\d/, "Пароль должен содержать хотя бы одну цифру");

export const createUserSchema = z.object({
	firstName: z.string().trim().min(1, "Имя обязательно"),
	lastName: z.string().trim().min(1, "Фамилия обязательна"),
	middleName: z.string().trim().max(255, "Отчество слишком длинное").optional(),
	login: z.string().trim().min(1, "Логин обязателен"),
	password: passwordSchema,
	avatarUrl: z.string().url("Аватар должен быть корректной ссылкой").optional(),
	roleId: z.coerce.number().int().positive("roleId должен быть положительным числом"),
});

export const updateUserSchema = createUserSchema.partial().extend({
	password: passwordSchema.optional(),
});
