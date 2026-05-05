import type { Prisma } from "../../generated/prisma/client.js";
import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../shared/errors/app-error.js";
import type { GetRolesQuery } from "./role.schemas.js";
import { defaultRolePermissions, type RolePermissions } from "./role.types.js";

const byList = {
	id: true,
	name: true,
	isAdmin: true,
	_count: {
		select: { users: true },
	},
} satisfies Prisma.RoleSelect;

const byFull = {
	id: true,
	name: true,
	description: true,
	isAdmin: true,
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

const CONST_ROLE_MUTATION_ERROR = "Системную роль нельзя изменять или удалять";

const ensureRoleIsMutable = (isAdmin: boolean) => {
	if (isAdmin) {
		throw new AppError(403, CONST_ROLE_MUTATION_ERROR);
	}
};

const buildRolesListOrderBy = (sorting: GetRolesQuery["sorting"]): Prisma.RoleOrderByWithRelationInput[] => {
	if (!sorting) {
		return [{ id: "asc" }];
	}

	return [
		{ [sorting.id]: sorting.sort } as Prisma.RoleOrderByWithRelationInput,
		...(sorting.id === "id" ? [] : [{ id: "asc" } as Prisma.RoleOrderByWithRelationInput]),
	];
};

export const listRoles = async (query: GetRolesQuery) =>
	prisma.role.findMany({
		where: query.search
			? {
					name: {
						contains: query.search,
						mode: "insensitive",
					},
				}
			: undefined,
		select: byList,
		orderBy: buildRolesListOrderBy(query.sorting),
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
	const role = await getRoleById(id);

	ensureRoleIsMutable(role.isAdmin);

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
	const role = await getRoleById(id);

	ensureRoleIsMutable(role.isAdmin);

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
			isAdmin: true,
			_count: {
				select: { users: true },
			},
		},
	});

	if (!role) {
		throw new AppError(404, "Роль не найдена");
	}

	ensureRoleIsMutable(role.isAdmin);

	if (role._count.users > 0) {
		throw new AppError(409, "Нельзя удалить роль, пока она назначена пользователям");
	}

	await prisma.role.delete({
		where: { id },
	});
};
