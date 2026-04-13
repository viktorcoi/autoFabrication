import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client.js";

declare global {
	// eslint-disable-next-line no-var
	var __prisma__: PrismaClient | undefined;
}

const adapter = new PrismaPg({
	connectionString:
		process.env.DATABASE_URL ?? "postgresql://postgres:postgres@localhost:5432/autofabrication?schema=public",
});

export const prisma = globalThis.__prisma__ ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
	globalThis.__prisma__ = prisma;
}
