import { z } from "zod";

const processOperationIdSchema = z.coerce
	.number()
	.int()
	.positive("Некорректный id операции техпроцесса");

const processStepIdSchema = z.coerce
	.number()
	.int()
	.positive("Некорректный id этапа");

const processStepClientIdSchema = z
	.string()
	.trim()
	.min(1, "Некорректный временный id этапа")
	.max(80, "Некорректный временный id этапа");

const processStepNameSchema = z
	.string()
	.trim()
	.min(1, "Название этапа обязательно")
	.max(50, "Название этапа слишком длинное");

const processStepDescriptionSchema = z
	.string()
	.trim()
	.max(255, "Описание этапа слишком длинное")
	.transform((value) => value.length > 0 ? value : null);

const processStepTableSortingSchema = z.object({
	id: z.enum([
		"index",
		"name",
		"tpz",
		"tsht",
		"workCount",
		"filesDownload",
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

const parseJsonArray = (value: unknown) => {
	if (Array.isArray(value)) {
		return value;
	}

	if (typeof value !== "string") {
		return value;
	}

	const normalizedValue = value.trim();

	if (!normalizedValue.length) {
		return [];
	}

	try {
		return JSON.parse(normalizedValue) as unknown;
	} catch {
		return value;
	}
};

const searchQuerySchema = z.preprocess(
	(value) => typeof value === "string" ? value.trim() : undefined,
	z.string().optional(),
).transform((value) => value && value.length > 0 ? value : undefined);

const updateProcessStepsItemSchema = z.object({
	id: processStepIdSchema.optional(),
	clientId: processStepClientIdSchema,
	name: processStepNameSchema,
	description: processStepDescriptionSchema.optional(),
	removedFileIds: z.array(processStepIdSchema).max(20, "Нельзя удалить больше 20 файлов за один этап").optional(),
}).strict();

export const getProcessStepsTableSchema = z.object({
	operationId: processOperationIdSchema,
	page: z.coerce.number().int().min(0).default(0),
	rows: z.coerce.number().int().positive().max(100).default(20),
	search: searchQuerySchema,
	sorting: z
		.preprocess(parseTableSorting, processStepTableSortingSchema.nullable())
		.optional()
		.transform((value) => value ?? null),
});

export const getProcessStepsSchema = z.object({
	operationId: processOperationIdSchema,
});

export const createProcessStepSchema = z.object({
	name: processStepNameSchema,
	description: processStepDescriptionSchema.optional(),
});

export const updateProcessStepSchema = z
	.object({
		name: processStepNameSchema.optional(),
		description: processStepDescriptionSchema.optional(),
		removedFileIds: z.preprocess(
			parseIdArray,
			z.array(processStepIdSchema).max(20, "Нельзя удалить больше 20 файлов за один запрос").optional(),
		),
	})
	.strict();

export const updateProcessStepsSchema = z.object({
	items: z.preprocess(
		parseJsonArray,
		z.array(updateProcessStepsItemSchema).max(500, "Нельзя сохранить больше 500 этапов за один запрос"),
	),
});

export type GetProcessStepsTableQuery = z.infer<typeof getProcessStepsTableSchema>;
export type GetProcessStepsQuery = z.infer<typeof getProcessStepsSchema>;
export type CreateProcessStepPayload = z.infer<typeof createProcessStepSchema>;
export type UpdateProcessStepPayload = z.infer<typeof updateProcessStepSchema>;
export type UpdateProcessStepsPayload = z.infer<typeof updateProcessStepsSchema>;
