import { z } from "zod";

const LOGIN_PATTERN = /^[\x21-\x7E]+$/;
const PERSON_NAME_PATTERN = /^\p{L}+$/u;

const loginSchema = z
	.string()
	.trim()
	.min(5, "Логин должен содержать не менее 5 латинских символов.")
	.max(35, 'Логин должен быть не более 35 символов')
	.regex(LOGIN_PATTERN, "Логин может содержать только латинские буквы, цифры и специальные символы.");

const passwordSchema = z
	.string()
	.min(6, "Пароль должен содержать не менее 6 символов.")
	.max(30, 'Пароль должен быть не более 30 символов');

const roleIdSchema = z.coerce
	.number()
	.int()
	.positive("roleId должен быть положительным числом");

const firstNameSchema = z
	.string()
	.trim()
	.min(1, "Имя обязательно")
	.max(20, "Имя слишком длинное")
	.regex(PERSON_NAME_PATTERN, "Имя может содержать только буквы.");

const lastNameSchema = z
	.string()
	.trim()
	.min(1, "Фамилия обязательна")
	.max(20, "Фамилия слишком длинная")
	.regex(PERSON_NAME_PATTERN, "Фамилия может содержать только буквы.");

const middleNameSchema = z
	.string()
	.trim()
	.max(20, "Отчество слишком длинное")
	.refine(
		(value) => value === "" || PERSON_NAME_PATTERN.test(value),
		"Отчество может содержать только буквы.",
	);

const userTableSortingSchema = z.object({
	id: z.enum(["id", "login", "lastName", "firstName", "middleName", "role", "avatar", "birthDate"]),
	sort: z.enum(["asc", "desc"]),
}).strict();

const userListSortingSchema = z.object({
	id: z.enum(["id", "name", "login"]),
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

const parseOptionalId = (value: unknown) => {
	if (value === undefined || value === null || value === "") {
		return undefined;
	}

	if (typeof value === "string") {
		const normalizedValue = value.trim();

		if (normalizedValue.length === 0) {
			return undefined;
		}

		return normalizedValue;
	}

	return value;
};

export const createUserSchema = z.object({
	firstName: firstNameSchema,
	lastName: lastNameSchema,
	middleName: middleNameSchema.optional(),
	birthDate: z.coerce.date(),
	login: loginSchema,
	password: passwordSchema,
	avatarUrl: z.string().url("Аватар должен быть корректной ссылкой").nullable().optional(),
	roleId: roleIdSchema,
});

export const updateUserSchema = createUserSchema.partial().extend({
	password: passwordSchema.optional(),
});

export const updateUsersTableItemSchema = z.object({
	firstName: firstNameSchema.optional(),
	lastName: lastNameSchema.optional(),
	middleName: middleNameSchema.optional(),
	birthDate: z.coerce.date().optional(),
}).strict().refine(
	(value) => Object.keys(value).length > 0,
	"Нет данных для обновления",
);

export const updateUsersTableSchema = z.record(
	z.string().regex(/^[1-9]\d*$/, "Некорректный id пользователя"),
	z.unknown(),
).refine(
	(value) => Object.keys(value).length > 0,
	"Нужно передать хотя бы одну строку для редактирования",
);

export const deleteUserIdsSchema = z.array(
	z.coerce.number().int().positive("id пользователя должен быть положительным числом"),
).min(1, "Нужно выбрать хотя бы одного пользователя");

export const getUsersSchema = z.object({
	search: z.preprocess(
		(value) => typeof value === "string" ? value.trim() : undefined,
		z.string().optional(),
	).transform((value) => value && value.length > 0 ? value : undefined),
	sorting: z.preprocess(parseTableSorting, userListSortingSchema.nullable()).optional().transform((value) => value ?? null),
});

export const getUsersTableSchema = z.object({
	page: z.coerce.number().int().min(0).default(0),
	rows: z.coerce.number().int().positive().max(100).default(20),
	search: z.preprocess(
		(value) => typeof value === "string" ? value.trim() : undefined,
		z.string().optional(),
	).transform((value) => value && value.length > 0 ? value : undefined),
	sorting: z.preprocess(parseTableSorting, userTableSortingSchema.nullable()).optional().transform((value) => value ?? null),
	roleId: z.preprocess(parseOptionalId, roleIdSchema.optional()),
});

export type GetUsersQuery = z.infer<typeof getUsersSchema>;
export type GetUsersTableQuery = z.infer<typeof getUsersTableSchema>;
export type DeleteUserIdsPayload = z.infer<typeof deleteUserIdsSchema>;
export type UpdateUsersTableItemPayload = z.infer<typeof updateUsersTableItemSchema>;
export type UpdateUsersTablePayload = z.infer<typeof updateUsersTableSchema>;
