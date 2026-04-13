import bcrypt from "bcrypt";
import { env } from "../src/config/env.js";
import { prisma } from "../src/lib/prisma.js";
import { adminPermissions } from "../src/modules/roles/role.types.js";
import { AppError } from "../src/shared/errors/app-error.js";

const seed = async () => {
	const adminRole = await prisma.role.upsert({
		where: {
			name: "ADMIN",
		},
		update: {
			description: "Главная системная роль с полным доступом.",
			permissions: adminPermissions,
		},
		create: {
			name: "ADMIN",
			description: "Главная системная роль с полным доступом.",
			permissions: adminPermissions,
		},
	});

	if (env.ADMIN_PASSWORD.length < 8) {
		throw new AppError(500, "ADMIN_PASSWORD должен содержать минимум 8 символов");
	}

	const passwordHash = await bcrypt.hash(env.ADMIN_PASSWORD, 12);

	await prisma.user.upsert({
		where: {
			login: env.ADMIN_LOGIN,
		},
		update: {
			firstName: env.ADMIN_FIRST_NAME,
			lastName: env.ADMIN_LAST_NAME,
			middleName: env.ADMIN_MIDDLE_NAME || null,
			passwordHash,
			roleId: adminRole.id,
		},
		create: {
			firstName: env.ADMIN_FIRST_NAME,
			lastName: env.ADMIN_LAST_NAME,
			middleName: env.ADMIN_MIDDLE_NAME || null,
			login: env.ADMIN_LOGIN,
			passwordHash,
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
