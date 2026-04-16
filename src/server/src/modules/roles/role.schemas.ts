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
