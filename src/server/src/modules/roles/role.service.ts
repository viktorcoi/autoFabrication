import type { Prisma } from "../../generated/prisma/client.js";
import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../shared/errors/app-error.js";

const roleSelect = {
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

export const listRoles = async () =>
	prisma.role.findMany({
		select: roleSelect,
		orderBy: {
			id: "asc",
		},
	});

export const getRoleById = async (id: number) => {
	const role = await prisma.role.findUnique({
		where: { id },
		select: roleSelect,
	});

	if (!role) {
		throw new AppError(404, "Роль не найдена");
	}

	return role;
};

export const createRole = async (data: Prisma.RoleCreateInput) => {
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
		data,
		select: roleSelect,
	});
};

export const updateRole = async (id: number, data: Prisma.RoleUpdateInput) => {
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
		select: roleSelect,
	});
};
