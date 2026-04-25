import { z } from "zod";

const passwordSchema = z.string().min(6, "Пароль должен содержать минимум 6 символов");
const userTableSortingSchema = z.object({
	id: z.enum(["id", "login", "lastName", "firstName", "middleName", "role", "avatar", "birthDate"]),
	sort: z.enum(["asc", "desc"]),
}).strict();

const parseTableSorting = (value: unknown) => {
	if (value === null || value === undefined || value === "" || value === "null") {
		return null;
	}

	if (typeof value !== "string") {
		return value;
	}

	const normalizedValue = value.trim();

	if (normalizedValue.length === 0 || normalizedValue === "null") {
		return null;
	}

	try {
		return JSON.parse(normalizedValue) as unknown;
	} catch {
		return value;
	}
};

export const createUserSchema = z.object({
	firstName: z.string().trim().min(1, "Имя обязательно"),
	lastName: z.string().trim().min(1, "Фамилия обязательна"),
	middleName: z.string().trim().max(255, "Отчество слишком длинное").optional(),
	birthDate: z.coerce.date(),
	login: z.string().trim().min(1, "Логин обязателен"),
	password: passwordSchema,
	avatarUrl: z.string().url("Аватар должен быть корректной ссылкой").nullable().optional(),
	roleId: z.coerce.number().int().positive("roleId должен быть положительным числом"),
});

export const updateUserSchema = createUserSchema.partial().extend({
	password: passwordSchema.optional(),
});

export const getUsersTableSchema = z.object({
	page: z.coerce.number().int().min(0).default(0),
	rows: z.coerce.number().int().positive().max(100).default(20),
	search: z.preprocess(
		(value) => typeof value === "string" ? value.trim() : undefined,
		z.string().optional(),
	).transform((value) => value && value.length > 0 ? value : undefined),
	sorting: z.preprocess(parseTableSorting, userTableSortingSchema.nullable()).optional().transform((value) => value ?? null),
});

export type GetUsersTableQuery = z.infer<typeof getUsersTableSchema>;
