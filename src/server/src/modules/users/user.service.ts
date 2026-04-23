import * as bcrypt from "bcrypt";
import type { Prisma } from "../../generated/prisma/client.js";
import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../shared/errors/app-error.js";
import { getRoleById } from "../roles/role.service.js";
import type { GetUsersTableQuery } from "./user.schemas.js";

const userSelect = {
	id: true,
	firstName: true,
	lastName: true,
	middleName: true,
	birthDate: true,
	login: true,
	avatarUrl: true,
	roleId: true,
	createdAt: true,
	updatedAt: true,
	role: {
		select: {
			id: true,
			name: true,
			description: true,
		},
	},
} satisfies Prisma.UserSelect;

const userTableSelect = {
	id: true,
	firstName: true,
	lastName: true,
	middleName: true,
	birthDate: true,
	login: true,
	avatarUrl: true,
	role: {
		select: {
			name: true,
		},
	},
} satisfies Prisma.UserSelect;

const USER_TABLE_FIELD_TO_MODEL_FIELD = {
	id: "id",
	login: "login",
	lastName: "lastName",
	firstName: "firstName",
	middleName: "middleName",
	role: "roleId",
	avatar: "avatarUrl",
	birthDate: "birthDate",
} as const;

const USER_OPTIONAL_MODEL_FIELDS = new Set<string>(["middleName", "avatarUrl"]);
const USER_SYSTEM_MODEL_FIELDS = new Set<string>(["id", "passwordHash", "createdAt", "updatedAt"]);
const USER_READONLY_TABLE_FIELDS = new Set<string>(["role"]);

const userTableMeta = Object.freeze({
	isConst: Object.freeze(
		Object.entries(USER_TABLE_FIELD_TO_MODEL_FIELD)
			.filter(([columnId, modelField]) => (
				USER_SYSTEM_MODEL_FIELDS.has(modelField) || USER_READONLY_TABLE_FIELDS.has(columnId)
			))
			.map(([columnId]) => columnId),
	),
	isRequired: Object.freeze(
		Object.entries(USER_TABLE_FIELD_TO_MODEL_FIELD)
			.filter(([columnId, modelField]) => (
				!USER_OPTIONAL_MODEL_FIELDS.has(modelField)
				&& !USER_SYSTEM_MODEL_FIELDS.has(modelField)
				&& !USER_READONLY_TABLE_FIELDS.has(columnId)
			))
			.map(([columnId]) => columnId),
	),
});

type CreateUserData = {
	firstName: string;
	lastName: string;
	middleName?: string;
	birthDate: Date;
	login: string;
	password: string;
	avatarUrl?: string;
	roleId: number;
};

type UpdateUserData = Partial<CreateUserData>;

const parseDateSearch = (value: string) => {
	const normalizedValue = value.trim();

	if (/^\d{2}\.\d{2}\.\d{4}$/.test(normalizedValue)) {
		const [day, month, year] = normalizedValue.split(".").map(Number);
		const start = new Date(Date.UTC(year, month - 1, day));

		if (Number.isNaN(start.getTime())) {
			return null;
		}

		return {
			start,
			end: new Date(Date.UTC(year, month - 1, day + 1)),
		};
	}

	if (/^\d{4}-\d{2}-\d{2}$/.test(normalizedValue)) {
		const [year, month, day] = normalizedValue.split("-").map(Number);
		const start = new Date(Date.UTC(year, month - 1, day));

		if (Number.isNaN(start.getTime())) {
			return null;
		}

		return {
			start,
			end: new Date(Date.UTC(year, month - 1, day + 1)),
		};
	}

	const parsedDate = new Date(normalizedValue);

	if (Number.isNaN(parsedDate.getTime())) {
		return null;
	}

	const start = new Date(Date.UTC(
		parsedDate.getUTCFullYear(),
		parsedDate.getUTCMonth(),
		parsedDate.getUTCDate(),
	));

	return {
		start,
		end: new Date(Date.UTC(
			parsedDate.getUTCFullYear(),
			parsedDate.getUTCMonth(),
			parsedDate.getUTCDate() + 1,
		)),
	};
};

const buildUsersTableWhere = (search?: string): Prisma.UserWhereInput | undefined => {
	if (!search) {
		return undefined;
	}

	const orFilters: Prisma.UserWhereInput[] = [
		{
			login: {
				contains: search,
				mode: "insensitive",
			},
		},
		{
			lastName: {
				contains: search,
				mode: "insensitive",
			},
		},
		{
			firstName: {
				contains: search,
				mode: "insensitive",
			},
		},
		{
			middleName: {
				contains: search,
				mode: "insensitive",
			},
		},
		{
			avatarUrl: {
				contains: search,
				mode: "insensitive",
			},
		},
		{
			role: {
				is: {
					name: {
						contains: search,
						mode: "insensitive",
					},
				},
			},
		},
	];
	const parsedDateRange = parseDateSearch(search);

	if (parsedDateRange) {
		orFilters.push({
			birthDate: {
				gte: parsedDateRange.start,
				lt: parsedDateRange.end,
			},
		});
	}

	return {
		OR: orFilters,
	};
};

const buildUsersTableOrderBy = (sorting: GetUsersTableQuery["sorting"]): Prisma.UserOrderByWithRelationInput[] => {
	if (!sorting) {
		return [{ id: "asc" }];
	}

	switch (sorting.id) {
		case "role":
			return [
				{ role: { name: sorting.sort } },
				{ id: "asc" },
			];
		case "avatar":
			return [
				{ avatarUrl: sorting.sort },
				{ id: "asc" },
			];
		default:
			return [
				{ [sorting.id]: sorting.sort } as Prisma.UserOrderByWithRelationInput,
				{ id: "asc" },
			];
	}
};

export const listUsers = async () =>
	prisma.user.findMany({
		select: userSelect,
		orderBy: {
			id: "asc",
		},
	});

export const getUsersTable = async (query: GetUsersTableQuery) => {
	const where = buildUsersTableWhere(query.search);
	const orderBy = buildUsersTableOrderBy(query.sorting);
	const skip = query.page * query.rows;
	const [total, users] = await prisma.$transaction([
		prisma.user.count({ where }),
		prisma.user.findMany({
			where,
			select: userTableSelect,
			orderBy,
			skip,
			take: query.rows,
		}),
	]);

	return {
		total,
		data: users.map((user) => ({
			id: user.id,
			login: user.login,
			lastName: user.lastName,
			firstName: user.firstName,
			...(user.middleName ? { middleName: user.middleName } : {}),
			role: user.role.name,
			...(user.avatarUrl ? { avatar: user.avatarUrl } : {}),
			birthDate: user.birthDate,
			isConst: [...userTableMeta.isConst],
			isRequired: [...userTableMeta.isRequired],
		})),
	};
};

export const getUserById = async (id: number) => {
	const user = await prisma.user.findUnique({
		where: { id },
		select: userSelect,
	});

	if (!user) {
		throw new AppError(404, "Пользователь не найден");
	}

	return user;
};

export const createUser = async (data: CreateUserData) => {
	const existingUser = await prisma.user.findUnique({
		where: {
			login: data.login,
		},
		select: {
			id: true,
		},
	});

	if (existingUser) {
		throw new AppError(409, "Пользователь с таким логином уже существует");
	}

	await getRoleById(data.roleId);

	const passwordHash = await bcrypt.hash(data.password, 12);

	return prisma.user.create({
		data: {
			firstName: data.firstName,
			lastName: data.lastName,
			middleName: data.middleName,
			birthDate: data.birthDate,
			login: data.login,
			passwordHash,
			avatarUrl: data.avatarUrl,
			role: {
				connect: {
					id: data.roleId,
				},
			},
		},
		select: userSelect,
	});
};

export const updateUser = async (id: number, data: UpdateUserData) => {
	await getUserById(id);

	if (data.login) {
		const existingUser = await prisma.user.findUnique({
			where: {
				login: data.login,
			},
			select: {
				id: true,
			},
		});

		if (existingUser && existingUser.id !== id) {
			throw new AppError(409, "Пользователь с таким логином уже существует");
		}
	}

	if (data.roleId) {
		await getRoleById(data.roleId);
	}

	const updateData: Prisma.UserUpdateInput = {
		firstName: data.firstName,
		lastName: data.lastName,
		middleName: data.middleName,
		birthDate: data.birthDate,
		login: data.login,
		avatarUrl: data.avatarUrl,
	};

	if (data.password) {
		updateData.passwordHash = await bcrypt.hash(data.password, 12);
	}

	if (data.roleId) {
		updateData.role = {
			connect: {
				id: data.roleId,
			},
		};
	}

	return prisma.user.update({
		where: { id },
		data: updateData,
		select: userSelect,
	});
};
