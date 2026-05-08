import { z } from "zod";

const processNameSchema = z
	.string()
	.trim()
	.min(1, "Название техпроцесса обязательно")
	.max(50, "Название техпроцесса слишком длинное");

const processDescriptionSchema = z
	.string()
	.trim()
	.max(255, "Описание техпроцесса слишком длинное")
	.transform((value) => value.length > 0 ? value : null);

const processIdSchema = z.coerce
	.number()
	.int()
	.positive("Некорректный id техпроцесса");

const productIdSchema = z.coerce
	.number()
	.int()
	.positive("Некорректный id изделия");

const blankIdSchema = z.coerce
	.number()
	.int()
	.positive("Некорректный id заготовки");

const processTableSortingSchema = z.object({
	id: z.enum([
		"id",
		"name",
		"creator",
		"blank",
		"filesDownload",
		"operationCount",
		"access",
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

const parseOptionalNullableId = (value: unknown) => {
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

export const createProcessSchema = z.object({
	productId: productIdSchema,
	name: processNameSchema,
	description: processDescriptionSchema.optional(),
	blankId: z.preprocess(parseOptionalNullableId, blankIdSchema.nullable().optional()),
});

export const updateProcessSchema = z
	.object({
		name: processNameSchema.optional(),
		description: processDescriptionSchema.optional(),
		blankId: z.preprocess(parseOptionalNullableId, blankIdSchema.nullable().optional()),
		removedFileIds: z.preprocess(
			parseIdArray,
			z.array(processIdSchema).max(20, "Нельзя удалить больше 20 файлов за один запрос").optional(),
		),
	})
	.strict();

export const updateProcessesTableItemSchema = z
	.object({
		name: processNameSchema.optional(),
		description: processDescriptionSchema.optional(),
	})
	.strict()
	.refine(
		(value) => Object.keys(value).length > 0,
		"Нет данных для обновления",
	);

export const updateProcessesTableSchema = z
	.record(
		z.string().regex(/^[1-9]\d*$/, "Некорректный id техпроцесса"),
		z.unknown(),
	)
	.refine(
		(value) => Object.keys(value).length > 0,
		"Нужно передать хотя бы одну строку для редактирования",
	);

export const updateProcessAccessSchema = z.object({
	disabled: z.boolean(),
});

export const deleteProcessIdsSchema = z
	.array(processIdSchema)
	.min(1, "Нужно выбрать хотя бы один техпроцесс");

export const getProcessesTableSchema = z.object({
	productId: productIdSchema,
	page: z.coerce.number().int().min(0).default(0),
	rows: z.coerce.number().int().positive().max(100).default(20),
	search: searchQuerySchema,
	sorting: z
		.preprocess(parseTableSorting, processTableSortingSchema.nullable())
		.optional()
		.transform((value) => value ?? null),
});

export type CreateProcessPayload = z.infer<typeof createProcessSchema>;
export type UpdateProcessPayload = z.infer<typeof updateProcessSchema>;
export type GetProcessesTableQuery = z.infer<typeof getProcessesTableSchema>;
export type UpdateProcessesTablePayload = z.infer<typeof updateProcessesTableSchema>;
export type UpdateProcessAccessPayload = z.infer<typeof updateProcessAccessSchema>;
