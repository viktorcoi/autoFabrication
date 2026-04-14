import * as bcrypt from "bcrypt";
import type { Prisma } from "../../generated/prisma/client.js";
import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../shared/errors/app-error.js";
import { getRoleById } from "../roles/role.service.js";

const userSelect = {
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
		},
	},
} satisfies Prisma.UserSelect;

type CreateUserData = {
	firstName: string;
	lastName: string;
	middleName?: string;
	login: string;
	password: string;
	avatarUrl?: string;
	roleId: number;
};

type UpdateUserData = Partial<CreateUserData>;

export const listUsers = async () =>
	prisma.user.findMany({
		select: userSelect,
		orderBy: {
			id: "asc",
		},
	});

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
