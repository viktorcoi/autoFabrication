import * as bcrypt from "bcrypt";
import { env } from "../src/config/env.js";
import { prisma } from "../src/lib/prisma.js";
import { adminPermissions } from "../src/modules/roles/role.types.js";
import { AppError } from "../src/shared/errors/app-error.js";

const ADMIN_ROLE_NAME = "Admin";
const ADMIN_ROLE_DESCRIPTION = "Главная системная роль с полным доступом.";

const seed = async () => {
	const adminRole = await prisma.role.upsert({
		where: {
			name: ADMIN_ROLE_NAME,
		},
		update: {
			description: ADMIN_ROLE_DESCRIPTION,
			isAdmin: true,
			permissions: adminPermissions,
		},
		create: {
			name: ADMIN_ROLE_NAME,
			description: ADMIN_ROLE_DESCRIPTION,
			isAdmin: true,
			permissions: adminPermissions,
		},
	});

	if (env.ADMIN_PASSWORD.length < 6) {
		throw new AppError(500, "ADMIN_PASSWORD должен содержать минимум 6 символов");
	}

	const passwordHash = await bcrypt.hash(env.ADMIN_PASSWORD, 12);
	const firstUser = await prisma.user.findFirst({
		select: {
			id: true,
		},
		orderBy: {
			id: "asc",
		},
	});

	await prisma.user.upsert({
		where: {
			login: env.ADMIN_LOGIN,
		},
		update: {
			firstName: env.ADMIN_FIRST_NAME,
			lastName: env.ADMIN_LAST_NAME,
			middleName: env.ADMIN_MIDDLE_NAME || null,
			birthDate: new Date(),
			passwordHash,
			roleId: adminRole.id,
		},
		create: {
			firstName: env.ADMIN_FIRST_NAME,
			lastName: env.ADMIN_LAST_NAME,
			middleName: env.ADMIN_MIDDLE_NAME || null,
			birthDate: new Date(),
			login: env.ADMIN_LOGIN,
			passwordHash,
			isAdmin: !firstUser,
			roleId: adminRole.id,
		},
	});
};

seed()
	.catch((error: unknown) => {
		console.error("Ошибка сидирования Prisma", error);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
