import type { Prisma } from "../../generated/prisma/client.js";
import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../shared/errors/app-error.js";
import { defaultRolePermissions, type RolePermissions } from "./role.types.js";

const byList = {
	id: true,
	name: true,
	_count: {
		select: { users: true },
	},
} satisfies Prisma.RoleSelect;

const byFull = {
	id: true,
	name: true,
	description: true,
	permissions: true,
	createdAt: true,
	updatedAt: true,
	_count: {
		select: { users: true },
	},
} satisfies Prisma.RoleSelect;

type CreateRoleData = {
	name: string;
	description?: string;
	permissions?: RolePermissions;
};

type UpdateRoleData = {
	name?: string;
	description?: string;
	permissions?: RolePermissions;
};

export const listRoles = async () =>
	prisma.role.findMany({
		select: byList,
		orderBy: {
			id: "asc",
		},
	});

export const getRoleById = async (id: number) => {
	const role = await prisma.role.findUnique({
		where: { id },
		select: byFull,
	});

	if (!role) {
		throw new AppError(404, "Роль не найдена");
	}

	return role;
};

export const createRole = async (data: CreateRoleData) => {
	const existingRole = await prisma.role.findUnique({
		where: {
			name: data.name,
		},
		select: {
			id: true,
		},
	});

	if (existingRole) {
		throw new AppError(409, "Роль с таким названием уже существует");
	}

	return prisma.role.create({
		data: {
			name: data.name,
			description: data.description,
			permissions: data.permissions ?? defaultRolePermissions,
		},
		select: byFull,
	});
};

export const updateRole = async (id: number, data: UpdateRoleData) => {
	await getRoleById(id);

	if (typeof data.name === "string") {
		const existingRole = await prisma.role.findUnique({
			where: { name: data.name },
			select: { id: true },
		});

		if (existingRole && existingRole.id !== id) {
			throw new AppError(409, "Роль с таким названием уже существует");
		}
	}

	return prisma.role.update({
		where: { id },
		data,
		select: byFull,
	});
};
