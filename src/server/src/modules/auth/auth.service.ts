import * as bcrypt from "bcrypt";
import type { Prisma } from "../../generated/prisma/client.js";
import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../shared/errors/app-error.js";
import type { RolePermissions } from "../roles/role.types.js";

const authUserSelect = {
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
			permissions: true,
		},
	},
} satisfies Prisma.UserSelect;

type AuthUser = Prisma.UserGetPayload<{
	select: typeof authUserSelect;
}>;

const hasAnyPermission = (permissions: RolePermissions) =>
	Object.values(permissions).some((permissionGroup) => Object.values(permissionGroup.access).some(Boolean));

const getMainUrl = (permissions: RolePermissions) => {
	for (const permissionGroup of Object.values(permissions)) {
		if (Object.values(permissionGroup.access).some(Boolean)) {
			return permissionGroup.url;
		}
	}

	return "";
};

const enrichAuthUser = (user: AuthUser) => {
	const permissions = user.role.permissions as RolePermissions;
	const isActive = hasAnyPermission(permissions);

	if (!isActive) {
		throw new AppError(403, "Ваша учетная запись не активна");
	}

	return {
		...user,
		mainUrl: getMainUrl(permissions),
	};
};

export const getAuthUserById = async (id: number) => {
	const user = await prisma.user.findUnique({
		where: { id },
		select: authUserSelect,
	});

	if (!user) {
		throw new AppError(404, "Пользователь не найден");
	}

	return enrichAuthUser(user);
};

export const loginUser = async (login: string, password: string) => {
	const user = await prisma.user.findUnique({
		where: { login },
		select: {
			id: true,
			login: true,
			passwordHash: true,
		},
	});

	if (!user) {
		throw new AppError(401, "Неверный логин или пароль");
	}

	const passwordMatches = await bcrypt.compare(password, user.passwordHash);

	if (!passwordMatches) {
		throw new AppError(401, "Неверный логин или пароль");
	}

	return getAuthUserById(user.id);
};
