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

type UpdateRoleDetailsData = {
	name?: string;
	description?: string;
};

export const listRoles = async (search?: string) =>
	prisma.role.findMany({
		where: search ? {
			name: {
				contains: search,
				mode: "insensitive",
			},
		} : undefined,
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

export const updateRoleDetails = async (id: number, data: UpdateRoleDetailsData) => {
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

export const updateRolePermissions = async (id: number, permissions: RolePermissions) => {
	await getRoleById(id);

	return prisma.role.update({
		where: { id },
		data: {
			permissions,
		},
		select: byFull,
	});
};

export const deleteRole = async (id: number) => {
	const role = await prisma.role.findUnique({
		where: { id },
		select: {
			id: true,
			_count: {
				select: { users: true },
			},
		},
	});

	if (!role) {
		throw new AppError(404, "Роль не найдена");
	}

	if (role._count.users > 0) {
		throw new AppError(409, "Нельзя удалить роль, пока она назначена пользователям");
	}

	await prisma.role.delete({
		where: { id },
	});
};
