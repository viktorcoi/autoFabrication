import { config } from "dotenv";
import { z } from "zod";

config();

const envSchema = z.object({
	PORT: z.coerce.number().int().positive().default(4000),
	DATABASE_URL: z
		.string()
		.min(1)
		.default("postgresql://postgres:postgres@localhost:5432/autofabrication?schema=public"),
	CLIENT_URL: z.string().url().default("http://localhost:3000"),
	UPLOAD_DIR: z.string().min(1).default("./storage"),
	ADMIN_LOGIN: z.string().min(1).default("admin"),
	ADMIN_PASSWORD: z
		.string()
		.min(6, "ADMIN_PASSWORD должен содержать минимум 6 символов")
		.regex(/\d/, "ADMIN_PASSWORD должен содержать хотя бы одну цифру")
		.default("admin12345"),
	ADMIN_FIRST_NAME: z.string().min(1).default("Главный"),
	ADMIN_LAST_NAME: z.string().min(1).default("Администратор"),
	ADMIN_MIDDLE_NAME: z.string().default(""),
	JWT_SECRET: z.string().min(16, "JWT_SECRET должен содержать минимум 16 символов"),
	JWT_EXPIRES_IN: z.string().default("7d"),
	AUTH_COOKIE_NAME: z.string().min(1).default("autofabrication_token"),
});

export const env = envSchema.parse(process.env);
