import { z } from "zod";

const rolePermissionFlagsSchema = z.object({
	view: z.boolean(),
	adding: z.boolean(),
	changeAccess: z.boolean(),
	editing: z.boolean(),
	removing: z.boolean(),
});

const userPermissionFlagsSchema = z.object({
	view: z.boolean(),
	adding: z.boolean(),
	editing: z.boolean(),
	resetPassword: z.boolean(),
	removing: z.boolean(),
});

const guidePermissionFlagsSchema = z.object({
	view: z.boolean(),
	adding: z.boolean(),
	editing: z.boolean(),
	removing: z.boolean(),
});

const productsPermissionFlagsSchema = z.object({
	view: z.boolean(),
	adding: z.boolean(),
	editing: z.boolean(),
	removing: z.boolean(),
	viewProcess: z.boolean(),
	addingProcess: z.boolean(),
	editingProcess: z.boolean(),
	removingProcess: z.boolean(),
	changeDisabledProcess: z.boolean(),
});

const roleListSortingSchema = z.object({
	id: z.enum(["id", "name"]),
	sort: z.enum(["asc", "desc"]),
}).strict();

const parseListSorting = (value: unknown) => {
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

export const getRolesSchema = z.object({
	search: z.preprocess(
		(value) => typeof value === "string" ? value.trim() : undefined,
		z.string().optional(),
	).transform((value) => value && value.length > 0 ? value : undefined),
	sorting: z
		.preprocess(parseListSorting, roleListSortingSchema.nullable())
		.optional()
		.transform((value) => value ?? null),
});

export const rolePermissionsSchema = z.object({
	1: z.object({
		url: z.literal("/roles"),
		access: rolePermissionFlagsSchema,
	}),
	2: z.object({
		url: z.literal("/users"),
		access: userPermissionFlagsSchema,
	}),
	3: z.object({
		url: z.literal("/guide"),
		access: guidePermissionFlagsSchema,
	}),
	4: z.object({
		url: z.literal("/products"),
		access: productsPermissionFlagsSchema,
	}),
});

export const createRoleSchema = z.object({
	name: z.string().trim().min(1, "Название роли обязательно").max(50, 'Название роли слишком длинное'),
	description: z.string().trim().max(255, "Описание роли слишком длинное").optional(),
	permissions: rolePermissionsSchema.optional(),
});

export const updateRoleDetailsSchema = z
	.object({
		name: z.string().trim().min(1, "Название роли обязательно").optional(),
		description: z.string().trim().max(1000, "Описание роли слишком длинное").optional(),
	})
	.refine((value) => value.name !== undefined || value.description !== undefined, {
		message: "Нужно передать хотя бы одно поле для обновления",
	});

export const updateRolePermissionsSchema = z.object({
	permissions: rolePermissionsSchema,
});

export type GetRolesQuery = z.infer<typeof getRolesSchema>;
