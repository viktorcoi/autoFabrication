import type { ZodType } from "zod";
import { AppError } from "../errors/app-error.js";

export const validate = <T>(schema: ZodType<T>, value: unknown): T => {
	const parsed = schema.safeParse(value);

	if (!parsed.success) {
		throw new AppError(400, parsed.error.issues[0]?.message ?? "Некорректные данные");
	}

	return parsed.data;
};
