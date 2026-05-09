import * as bcrypt from "bcrypt";
import type { Prisma } from "../../generated/prisma/client.js";
import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../shared/errors/app-error.js";
import { getStoredAvatarAbsolutePath, removeStoredFile } from "../../shared/storage/avatars.js";
import { getRoleById } from "../roles/role.service.js";
import type { RolePermissions } from "../roles/role.types.js";
import { updateUsersTableItemSchema } from "./user.schemas.js";
import type { GetUsersQuery, GetUsersTableQuery, UpdateUsersTablePayload } from "./user.schemas.js";

const userSelect = {
	id: true,
	firstName: true,
	lastName: true,
	middleName: true,
	birthDate: true,
	login: true,
	avatarUrl: true,
	isAdmin: true,
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
	isAdmin: true,
	role: {
		select: {
			name: true,
		},
	},
} satisfies Prisma.UserSelect;

const userListSelect = {
	id: true,
	firstName: true,
	lastName: true,
	middleName: true,
	login: true,
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
const USER_TABLE_ALL_FIELDS = Object.freeze(Object.keys(USER_TABLE_FIELD_TO_MODEL_FIELD));

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
	avatarUrl?: string | null;
	roleId: number;
};

type UpdateUserData = Partial<CreateUserData>;

type DeleteUsersResultItem = {
	id: number;
	description: string;
};

export type DeleteUsersResult = {
	success: DeleteUsersResultItem[];
	error: DeleteUsersResultItem[];
};

const UPDATE_GOD_USER_ROLE_ERROR = "Роль первого пользователя нельзя изменить";
const UPDATE_GOD_USER_ERROR = "Первого пользователя может изменять только он сам";

const DELETE_USER_NO_RIGHTS_ERROR = "У вас нет прав для удаления";
const DELETE_SELF_ERROR = "Нельзя удалить самого себя";
const DELETE_USER_GOD_ERROR = "Первого пользователя нельзя удалить";
const DELETE_USER_IN_USE_ERROR = "Этот пользователь используется и не может быть удален";

const UPDATE_USER_NO_RIGHTS_ERROR = "У вас нет прав для редактирования";
const UPDATE_USER_SUCCESS_DESCRIPTION = "Отредактировано";
const getUniqueIds = (ids: number[]) => {
	const uniqueIds = new Set<number>();

	return ids.filter((id) => {
		if (uniqueIds.has(id)) {
			return false;
		}

		uniqueIds.add(id);
		return true;
	});
};

const hasUsersRemovingPermission = (permissions: RolePermissions) =>
	Object.values(permissions).some((permission) => (
		permission.url === "/users"
		&& permission.access.view
		&& permission.access.removing
	));

const hasUsersEditingPermission = (permissions: RolePermissions) =>
	Object.values(permissions).some((permission) => (
		permission.url === "/users"
		&& permission.access.view
		&& permission.access.editing
	));

const getValidationErrorMessage = (issues: Array<{ message: string }>) => {
	const messages = issues
		.map((issue) => issue.message.trim())
		.filter(Boolean);

	return Array.from(new Set(messages)).join(" / ");
};

const isPrismaDeleteConstraintError = (error: unknown) =>
	Boolean(
		error
		&& typeof error === "object"
		&& "code" in error
		&& (error.code === "P2003" || error.code === "P2014"),
	);

const isPrismaRecordNotFoundError = (error: unknown) =>
	Boolean(
		error
		&& typeof error === "object"
		&& "code" in error
		&& error.code === "P2025",
	);

const getUserTableConstFields = (user: { id: number; isAdmin: boolean }, actorId: number) => {
	if (!user.isAdmin || actorId === user.id) {
		return [...userTableMeta.isConst];
	}

	return Array.from(new Set([
		...userTableMeta.isConst,
		...USER_TABLE_ALL_FIELDS,
	]));
};

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

const buildUsersTableWhere = (query: GetUsersTableQuery): Prisma.UserWhereInput | undefined => {
	const filters: Prisma.UserWhereInput = {};
	const search = query.search;

	if (search) {
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

		filters.OR = orFilters;
	}

	if (typeof query.roleId === "number") {
		filters.roleId = query.roleId;
	}

	return Object.keys(filters).length ? filters : undefined;
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

const buildUsersListWhere = (query: GetUsersQuery): Prisma.UserWhereInput | undefined => {
	if (!query.search) {
		return undefined;
	}

	return {
		OR: [
			{
				login: {
					contains: query.search,
					mode: "insensitive",
				},
			},
			{
				lastName: {
					contains: query.search,
					mode: "insensitive",
				},
			},
			{
				firstName: {
					contains: query.search,
					mode: "insensitive",
				},
			},
			{
				middleName: {
					contains: query.search,
					mode: "insensitive",
				},
			},
		],
	};
};

const buildUsersListOrderBy = (sorting: GetUsersQuery["sorting"]): Prisma.UserOrderByWithRelationInput[] => {
	if (!sorting) {
		return [
			{ lastName: "asc" },
			{ firstName: "asc" },
			{ middleName: "asc" },
			{ id: "asc" },
		];
	}

	switch (sorting.id) {
		case "name":
			return [
				{ lastName: sorting.sort },
				{ firstName: sorting.sort },
				{ middleName: sorting.sort },
				{ id: "asc" },
			];
		default:
			return [
				{ [sorting.id]: sorting.sort } as Prisma.UserOrderByWithRelationInput,
				{ id: "asc" },
			];
	}
};

export const listUsers = async (query: GetUsersQuery) =>
	prisma.user.findMany({
		where: buildUsersListWhere(query),
		select: userListSelect,
		orderBy: buildUsersListOrderBy(query.sorting),
	});

export const getUsersTable = async (query: GetUsersTableQuery, actorId: number) => {
	const where = buildUsersTableWhere(query);
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
			isAdmin: user.isAdmin,
			role: user.role.name,
			...(user.avatarUrl ? { avatar: user.avatarUrl } : {}),
			birthDate: user.birthDate,
			isConst: getUserTableConstFields(user, actorId),
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
	const isFirstUser = await prisma.user.count() === 0;

	return prisma.user.create({
		data: {
			firstName: data.firstName,
			lastName: data.lastName,
			middleName: data.middleName,
			birthDate: data.birthDate,
			login: data.login,
			passwordHash,
			avatarUrl: data.avatarUrl,
			isAdmin: isFirstUser,
			role: {
				connect: {
					id: data.roleId,
				},
			},
		},
		select: userSelect,
	});
};

export const updateUser = async (id: number, data: UpdateUserData, actorId: number) => {
	await getUserById(id);

	const user = await prisma.user.findUnique({
		where: { id },
		select: {
			id: true,
			isAdmin: true,
			roleId: true,
		},
	});

	if (!user) {
		throw new AppError(404, "Пользователь не найден");
	}

	if (user?.isAdmin && actorId !== user.id) {
		throw new AppError(403, UPDATE_GOD_USER_ERROR);
	}

	if (user.isAdmin && data.roleId !== undefined && data.roleId !== user.roleId) {
		throw new AppError(403, UPDATE_GOD_USER_ROLE_ERROR);
	}

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

export const updateUsersTable = async (
	payload: UpdateUsersTablePayload,
	actorId: number,
): Promise<DeleteUsersResult> => {
	const actor = await prisma.user.findUnique({
		where: { id: actorId },
		select: {
			role: {
				select: {
					permissions: true,
				},
			},
		},
	});
	if (!actor) {
		throw new AppError(404, "Пользователь не найден");
	}
	const permissions = actor.role.permissions as RolePermissions;
	const ids = Object.keys(payload).map((id) => Number(id));
	if (!hasUsersEditingPermission(permissions)) {
		return {
			success: [],
			error: ids.map((id) => ({
				id,
				description: UPDATE_USER_NO_RIGHTS_ERROR,
			})),
		};
	}
	const result: DeleteUsersResult = {
		success: [],
		error: [],
	};
	for (const [rawId, rawItem] of Object.entries(payload)) {
		const id = Number(rawId);
		const parsedItem = updateUsersTableItemSchema.safeParse(rawItem);
		if (!parsedItem.success) {
			result.error.push({
				id,
				description: getValidationErrorMessage(parsedItem.error.issues) || "Некорректные данные",
			});
			continue;
		}
		try {
			await updateUser(id, parsedItem.data, actorId);
			result.success.push({
				id,
				description: UPDATE_USER_SUCCESS_DESCRIPTION,
			});
		} catch (error) {
			if (error instanceof AppError) {
				result.error.push({
					id,
					description: error.message,
				});
				continue;
			}
			throw error;
		}
	}
	return result;
};

export const deleteUsers = async (ids: number[], actorId: number): Promise<DeleteUsersResult> => {
	const uniqueIds = getUniqueIds(ids);
	const actor = await prisma.user.findUnique({
		where: { id: actorId },
		select: {
			role: {
				select: {
					permissions: true,
				},
			},
		},
	});

	if (!actor) {
		throw new AppError(404, "Пользователь не найден");
	}

	const permissions = actor.role.permissions as RolePermissions;

	if (!hasUsersRemovingPermission(permissions)) {
		return {
			success: [],
			error: uniqueIds.map((id) => ({
				id,
				description: DELETE_USER_NO_RIGHTS_ERROR,
			})),
		};
	}

	const users = await prisma.user.findMany({
		where: {
			id: {
				in: uniqueIds,
			},
		},
		select: {
			id: true,
			avatarUrl: true,
			isAdmin: true,
		},
	});
	const usersById = new Map(users.map((user) => [user.id, user]));
	const result: DeleteUsersResult = {
		success: [],
		error: [],
	};

	for (const id of uniqueIds) {
		const user = usersById.get(id);

		if (id === actorId) {
			result.error.push({
				id,
				description: DELETE_SELF_ERROR,
			});
			continue;
		}

		if (user?.isAdmin) {
			result.error.push({
				id,
				description: DELETE_USER_GOD_ERROR,
			});
			continue;
		}

		if (!user) {
			result.error.push({
				id,
				description: "Пользователь не найден",
			});
			continue;
		}

		try {
			const deletedUser = await prisma.user.delete({
				where: { id },
				select: {
					id: true,
					avatarUrl: true,
				},
			});
			const avatarAbsolutePath = deletedUser.avatarUrl
				? getStoredAvatarAbsolutePath(deletedUser.avatarUrl)
				: null;

			if (avatarAbsolutePath) {
				try {
					// The user record is already removed, so avatar cleanup is best-effort here.
					await removeStoredFile(avatarAbsolutePath);
				} catch {
					// Ignore avatar cleanup failures to avoid reporting the whole user deletion as failed.
				}
			}

			result.success.push({
				id,
				description: "Удалено",
			});
		} catch (error) {
			if (isPrismaDeleteConstraintError(error)) {
				result.error.push({
					id,
					description: DELETE_USER_IN_USE_ERROR,
				});
				continue;
			}

			if (isPrismaRecordNotFoundError(error)) {
				result.error.push({
					id,
					description: "Пользователь не найден",
				});
				continue;
			}

			throw error;
		}
	}

	return result;
};
