import { z } from "zod";

const processStepIdSchema = z.coerce
	.number()
	.int()
	.positive("Некорректный id этапа");

const processWorkIdSchema = z.coerce
	.number()
	.int()
	.positive("Некорректный id работы этапа");

const guideWorkIdSchema = z.coerce
	.number()
	.int()
	.positive("Некорректный id работы");

const workGroupIdSchema = z.coerce
	.number()
	.int()
	.positive("Некорректный id группы работ");

const processWorkTimeSchema = z.coerce
	.number()
	.min(0, "Время не может быть меньше 0")
	.max(1_000_000, "Время слишком большое");

const processWorkCountSchema = z.coerce
	.number()
	.int()
	.min(1, "Количество должно быть не меньше 1")
	.max(1_000_000, "Количество слишком большое");

const processWorkDescriptionSchema = z
	.string()
	.trim()
	.max(255, "Описание работы слишком длинное")
	.transform((value) => value.length > 0 ? value : null);

const processWorkTableSortingSchema = z.object({
	id: z.enum([
		"index",
		"name",
		"tpz",
		"tsht",
		"count",
		"workGroup",
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

const parseNullableId = (value: unknown) => value === null ? undefined : value;

const searchQuerySchema = z.preprocess(
	(value) => typeof value === "string" ? value.trim() : undefined,
	z.string().optional(),
).transform((value) => value && value.length > 0 ? value : undefined);

const updateProcessWorksItemSchema = z.object({
	id: z.preprocess(parseNullableId, processWorkIdSchema.optional()),
	workId: guideWorkIdSchema,
	count: processWorkCountSchema,
}).strict();

export const getProcessWorksTableSchema = z.object({
	stepId: processStepIdSchema,
	page: z.coerce.number().int().min(0).default(0),
	rows: z.coerce.number().int().positive().max(100).default(20),
	search: searchQuerySchema,
	sorting: z
		.preprocess(parseTableSorting, processWorkTableSortingSchema.nullable())
		.optional()
		.transform((value) => value ?? null),
	workGroupId: z.preprocess(parseOptionalId, workGroupIdSchema.optional()),
});

export const getProcessWorksSchema = z.object({
	stepId: processStepIdSchema,
});

export const updateProcessWorkSchema = z
	.object({
		tpz: processWorkTimeSchema.optional(),
		tsht: processWorkTimeSchema.optional(),
		count: processWorkCountSchema.optional(),
		description: processWorkDescriptionSchema.optional(),
	})
	.strict();

export const updateProcessWorksSchema = z.object({
	items: z
		.array(updateProcessWorksItemSchema)
		.max(500, "Нельзя сохранить больше 500 работ за один запрос"),
});

export type GetProcessWorksTableQuery = z.infer<typeof getProcessWorksTableSchema>;
export type GetProcessWorksQuery = z.infer<typeof getProcessWorksSchema>;
export type UpdateProcessWorkPayload = z.infer<typeof updateProcessWorkSchema>;
export type UpdateProcessWorksPayload = z.infer<typeof updateProcessWorksSchema>;
