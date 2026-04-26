import { z } from "zod";

const LOGIN_PATTERN = /^[\x21-\x7E]+$/;
const PERSON_NAME_PATTERN = /^\p{L}+$/u;

const loginSchema = z
	.string()
	.trim()
	.min(5, "Логин должен содержать не менее 5 латинских символов.")
	.regex(LOGIN_PATTERN, "Логин может содержать только латинские буквы, цифры и специальные символы.");

const passwordSchema = z.string().min(6, "Пароль должен содержать не менее 6 символов.");

const firstNameSchema = z
	.string()
	.trim()
	.min(1, "\u0418\u043c\u044f \u043e\u0431\u044f\u0437\u0430\u0442\u0435\u043b\u044c\u043d\u043e")
	.max(255, "\u0418\u043c\u044f \u0441\u043b\u0438\u0448\u043a\u043e\u043c \u0434\u043b\u0438\u043d\u043d\u043e\u0435")
	.regex(PERSON_NAME_PATTERN, "\u0418\u043c\u044f \u043c\u043e\u0436\u0435\u0442 \u0441\u043e\u0434\u0435\u0440\u0436\u0430\u0442\u044c \u0442\u043e\u043b\u044c\u043a\u043e \u0431\u0443\u043a\u0432\u044b.");

const lastNameSchema = z
	.string()
	.trim()
	.min(1, "\u0424\u0430\u043c\u0438\u043b\u0438\u044f \u043e\u0431\u044f\u0437\u0430\u0442\u0435\u043b\u044c\u043d\u0430")
	.max(255, "\u0424\u0430\u043c\u0438\u043b\u0438\u044f \u0441\u043b\u0438\u0448\u043a\u043e\u043c \u0434\u043b\u0438\u043d\u043d\u0430\u044f")
	.regex(PERSON_NAME_PATTERN, "\u0424\u0430\u043c\u0438\u043b\u0438\u044f \u043c\u043e\u0436\u0435\u0442 \u0441\u043e\u0434\u0435\u0440\u0436\u0430\u0442\u044c \u0442\u043e\u043b\u044c\u043a\u043e \u0431\u0443\u043a\u0432\u044b.");

const middleNameSchema = z
	.string()
	.trim()
	.max(255, "\u041e\u0442\u0447\u0435\u0441\u0442\u0432\u043e \u0441\u043b\u0438\u0448\u043a\u043e\u043c \u0434\u043b\u0438\u043d\u043d\u043e\u0435")
	.refine(
		(value) => value === "" || PERSON_NAME_PATTERN.test(value),
		"\u041e\u0442\u0447\u0435\u0441\u0442\u0432\u043e \u043c\u043e\u0436\u0435\u0442 \u0441\u043e\u0434\u0435\u0440\u0436\u0430\u0442\u044c \u0442\u043e\u043b\u044c\u043a\u043e \u0431\u0443\u043a\u0432\u044b.",
	);

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
	firstName: firstNameSchema,
	lastName: lastNameSchema,
	middleName: middleNameSchema.optional(),
	birthDate: z.coerce.date(),
	login: loginSchema,
	password: passwordSchema,
	avatarUrl: z.string().url("Аватар должен быть корректной ссылкой").nullable().optional(),
	roleId: z.coerce.number().int().positive("roleId должен быть положительным числом"),
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
export type DeleteUserIdsPayload = z.infer<typeof deleteUserIdsSchema>;
export type UpdateUsersTableItemPayload = z.infer<typeof updateUsersTableItemSchema>;
export type UpdateUsersTablePayload = z.infer<typeof updateUsersTableSchema>;
