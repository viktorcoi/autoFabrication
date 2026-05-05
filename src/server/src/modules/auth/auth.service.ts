import * as bcrypt from "bcrypt";
import type { Prisma } from "../../generated/prisma/client.js";
import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../shared/errors/app-error.js";
import {
	getMainUrl,
	hasAccessibleRoute,
} from "../../shared/http/permissions.js";

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

const enrichAuthUser = (user: AuthUser) => {
	const permissions = user.role.permissions as Parameters<typeof hasAccessibleRoute>[0];
	const isActive = hasAccessibleRoute(permissions);

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

export const changeAuthUserPassword = async (
	userId: number,
	oldPassword: string,
	newPassword: string,
) => {
	const user = await prisma.user.findUnique({
		where: { id: userId },
		select: {
			id: true,
			passwordHash: true,
		},
	});

	if (!user) {
		throw new AppError(404, "Пользователь не найден");
	}

	const oldPasswordMatches = await bcrypt.compare(oldPassword, user.passwordHash);

	if (!oldPasswordMatches) {
		throw new AppError(400, "Текущий пароль указан неверно");
	}

	const newPasswordMatchesOld = await bcrypt.compare(newPassword, user.passwordHash);

	if (newPasswordMatchesOld) {
		throw new AppError(400, "Новый пароль должен отличаться от текущего");
	}

	const passwordHash = await bcrypt.hash(newPassword, 12);

	await prisma.user.update({
		where: { id: user.id },
		data: { passwordHash },
		select: { id: true },
	});
};
