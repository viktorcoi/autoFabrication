import { z } from "zod";

const processIdSchema = z.coerce
	.number()
	.int()
	.positive("Некорректный id техпроцесса");

const processOperationIdSchema = z.coerce
	.number()
	.int()
	.positive("Некорректный id операции техпроцесса");

const guideOperationIdSchema = z.coerce
	.number()
	.int()
	.positive("Некорректный id операции");

const operationGroupIdSchema = z.coerce
	.number()
	.int()
	.positive("Некорректный id группы операций");

const exitSchema = z.coerce
	.number()
	.int()
	.min(0, "Выход не может быть меньше 0")
	.max(1_000_000, "Выход слишком большой");

const descriptionSchema = z
	.string()
	.trim()
	.max(255, "Описание операции слишком длинное")
	.transform((value) => value.length > 0 ? value : null);

const processOperationTableSortingSchema = z.object({
	id: z.enum([
		"index",
		"name",
		"tpz",
		"tsht",
		"stepCount",
		"operationGroup",
		"filesDownload",
		"exit",
		"description",
	]),
	sort: z.enum(["asc", "desc"]),
}).strict();

const parseTableSorting = (value: unknown) => {
	if (value === null || value === undefined || value === "" || value === "null") {
		return null;
	}

	if (typeof value !== "string") {
		return value;
	}

	const normalizedValue = value.trim();

	if (normalizedValue.length === 0 || normalizedValue === "null") {
		return null;
	}

	try {
		return JSON.parse(normalizedValue) as unknown;
	} catch {
		return value;
	}
};

const parseOptionalId = (value: unknown) => {
	if (value === undefined || value === null || value === "") {
		return undefined;
	}

	if (typeof value === "string") {
		const normalizedValue = value.trim();

		if (normalizedValue.length === 0) {
			return undefined;
		}

		return normalizedValue;
	}

	return value;
};

const parseOptionalNullableNumber = (value: unknown) => {
	if (value === undefined || value === null) {
		return undefined;
	}

	if (typeof value === "string") {
		const normalizedValue = value.trim();

		if (normalizedValue.length === 0 || normalizedValue === "null") {
			return null;
		}

		return normalizedValue;
	}

	return value;
};

const parseIdArray = (value: unknown) => {
	if (value === undefined || value === null || value === "") {
		return undefined;
	}

	if (Array.isArray(value)) {
		return value;
	}

	if (typeof value !== "string") {
		return value;
	}

	const normalizedValue = value.trim();

	if (normalizedValue.length === 0) {
		return undefined;
	}

	if (normalizedValue.startsWith("[")) {
		try {
			return JSON.parse(normalizedValue) as unknown;
		} catch {
			return value;
		}
	}

	return [normalizedValue];
};

const searchQuerySchema = z.preprocess(
	(value) => typeof value === "string" ? value.trim() : undefined,
	z.string().optional(),
).transform((value) => value && value.length > 0 ? value : undefined);

export const getProcessOperationsTableSchema = z.object({
	processId: processIdSchema,
	page: z.coerce.number().int().min(0).default(0),
	rows: z.coerce.number().int().positive().max(100).default(20),
	search: searchQuerySchema,
	sorting: z
		.preprocess(parseTableSorting, processOperationTableSortingSchema.nullable())
		.optional()
		.transform((value) => value ?? null),
	operationGroupId: z.preprocess(parseOptionalId, operationGroupIdSchema.optional()),
});

export const getProcessOperationsSchema = z.object({
	processId: processIdSchema,
});

export const updateProcessOperationsSchema = z.object({
	operationIds: z
		.array(guideOperationIdSchema)
		.max(500, "Нельзя привязать больше 500 операций за один запрос"),
});

export const updateProcessOperationSchema = z
	.object({
		exit: z.preprocess(parseOptionalNullableNumber, exitSchema.nullable().optional()),
		description: descriptionSchema.optional(),
		removedFileIds: z.preprocess(
			parseIdArray,
			z.array(processOperationIdSchema).max(20, "Нельзя удалить больше 20 файлов за один запрос").optional(),
		),
	})
	.strict();

export type GetProcessOperationsTableQuery = z.infer<typeof getProcessOperationsTableSchema>;
export type GetProcessOperationsQuery = z.infer<typeof getProcessOperationsSchema>;
export type UpdateProcessOperationsPayload = z.infer<typeof updateProcessOperationsSchema>;
export type UpdateProcessOperationPayload = z.infer<typeof updateProcessOperationSchema>;
