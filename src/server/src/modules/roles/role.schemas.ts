import { z } from "zod";

const permissionFlagsSchema = z.object({
	view: z.boolean(),
	adding: z.boolean(),
	changeAccess: z.boolean(),
	editing: z.boolean(),
	removing: z.boolean(),
});

export const rolePermissionsSchema = z.record(z.string().min(1), permissionFlagsSchema);

export const createRoleSchema = z.object({
	name: z.string().trim().min(1, "Название роли обязательно"),
	description: z.string().trim().max(1000, "Описание роли слишком длинное").optional(),
	permissions: rolePermissionsSchema,
});

export const updateRoleSchema = createRoleSchema.partial();
