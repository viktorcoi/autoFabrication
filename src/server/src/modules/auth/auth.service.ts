import * as bcrypt from "bcrypt";
import type { Prisma } from "../../generated/prisma/client.js";
import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../shared/errors/app-error.js";

const authUserSelect = {
	id: true,
	firstName: true,
	lastName: true,
	middleName: true,
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
			permissions: true,
		},
	},
} satisfies Prisma.UserSelect;

export const getAuthUserById = async (id: number) => {
	const user = await prisma.user.findUnique({
		where: { id },
		select: authUserSelect,
	});

	if (!user) {
		throw new AppError(404, "Пользователь не найден");
	}

	return user;
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
