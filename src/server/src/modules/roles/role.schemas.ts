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
});

export const createRoleSchema = z.object({
	name: z.string().trim().min(1, "Название роли обязательно"),
	description: z.string().trim().max(1000, "Описание роли слишком длинное").optional(),
	permissions: rolePermissionsSchema.optional(),
});

export const updateRoleSchema = z.object({
	name: z.string().trim().min(1, "Название роли обязательно").optional(),
	description: z.string().trim().max(1000, "Описание роли слишком длинное").optional(),
	permissions: rolePermissionsSchema.optional(),
});
