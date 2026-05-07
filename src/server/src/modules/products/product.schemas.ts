import { z } from "zod";

const productNameSchema = z
	.string()
	.trim()
	.min(1, "Название изделия обязательно")
	.max(100, "Название изделия слишком длинное");

const productDescriptionSchema = z
	.string()
	.trim()
	.max(1000, "Описание изделия слишком длинное")
	.transform((value) => value.length > 0 ? value : null);

const productIdSchema = z.coerce
	.number()
	.int()
	.positive("Некорректный id изделия");

const typeProductIdSchema = z.coerce
	.number()
	.int()
	.positive("Некорректный id типа изделия");

const materialIdSchema = z.coerce
	.number()
	.int()
	.positive("Некорректный id материала");

const creatorIdSchema = z.coerce
	.number()
	.int()
	.positive("Некорректный id создателя");

const productComponentSchema = z.object({
	productId: productIdSchema,
	count: z.coerce
		.number()
		.int()
		.positive("Количество связанного изделия должно быть положительным числом"),
}).strict();

const productsTableSortingSchema = z.object({
	id: z.enum([
		"name",
		"typeProduct",
		"material",
		"creator",
		"createdAt",
		"filesDownload",
		"relatedProductsCount",
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

const parseComponents = (value: unknown) => {
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

	if (!normalizedValue.length) {
		return undefined;
	}

	try {
		return JSON.parse(normalizedValue) as unknown;
	} catch {
		return value;
	}
};

const parseDateBoundary = (boundary: "start" | "end") => (value: unknown) => {
	if (value === undefined || value === null || value === "") {
		return undefined;
	}

	if (value instanceof Date) {
		return value;
	}

	if (typeof value !== "string") {
		return value;
	}

	const normalizedValue = value.trim();

	if (!normalizedValue.length) {
		return undefined;
	}

	if (/^\d{4}-\d{2}-\d{2}$/.test(normalizedValue)) {
		const [year, month, day] = normalizedValue.split("-").map(Number);
		return new Date(Date.UTC(year, month - 1, day + (boundary === "end" ? 1 : 0)));
	}

	const parsedDate = new Date(normalizedValue);

	if (Number.isNaN(parsedDate.getTime())) {
		return parsedDate;
	}

	return parsedDate;
};

const dateBoundarySchema = (boundary: "start" | "end") =>
	z.preprocess(parseDateBoundary(boundary), z.date().optional());

const searchQuerySchema = z.preprocess(
	(value) => typeof value === "string" ? value.trim() : undefined,
	z.string().optional(),
).transform((value) => value && value.length > 0 ? value : undefined);

export const createProductSchema = z.object({
	name: productNameSchema,
	description: productDescriptionSchema.optional(),
	typeProductId: typeProductIdSchema,
	materialId: materialIdSchema,
	relatedProducts: z.preprocess(
		parseComponents,
		z.array(productComponentSchema).max(100, "Нельзя связать больше 100 изделий").optional(),
	),
});

export const updateProductSchema = z
	.object({
		name: productNameSchema.optional(),
		description: productDescriptionSchema.optional(),
		typeProductId: typeProductIdSchema.optional(),
		materialId: materialIdSchema.optional(),
		relatedProducts: z.preprocess(
			parseComponents,
			z.array(productComponentSchema).max(100, "Нельзя связать больше 100 изделий").optional(),
		),
		removedFileIds: z.preprocess(
			parseIdArray,
			z.array(productIdSchema).max(20, "Нельзя удалить больше 20 файлов за один запрос").optional(),
		),
		removedImageIds: z.preprocess(
			parseIdArray,
			z.array(productIdSchema).max(20, "Нельзя удалить больше 20 изображений за один запрос").optional(),
		),
	})
	.strict();

export const updateProductsTableItemSchema = z
	.object({
		name: productNameSchema.optional(),
		description: productDescriptionSchema.optional(),
	})
	.strict()
	.refine(
		(value) => Object.keys(value).length > 0,
		"Нет данных для обновления",
	);

export const updateProductsTableSchema = z
	.record(
		z.string().regex(/^[1-9]\d*$/, "Некорректный id изделия"),
		z.unknown(),
	)
	.refine(
		(value) => Object.keys(value).length > 0,
		"Нужно передать хотя бы одну строку для редактирования",
	);

export const deleteProductIdsSchema = z
	.array(productIdSchema)
	.min(1, "Нужно выбрать хотя бы одно изделие");

export const getProductsTableSchema = z.object({
	page: z.coerce.number().int().min(0).default(0),
	rows: z.coerce.number().int().positive().max(100).default(20),
	search: searchQuerySchema,
	sorting: z
		.preprocess(parseTableSorting, productsTableSortingSchema.nullable())
		.optional()
		.transform((value) => value ?? null),
	typeProductId: z.preprocess(parseOptionalId, typeProductIdSchema.optional()),
	materialId: z.preprocess(parseOptionalId, materialIdSchema.optional()),
	creatorId: z.preprocess(parseOptionalId, creatorIdSchema.optional()),
	createdAtFrom: dateBoundarySchema("start"),
	createdAtTo: dateBoundarySchema("end"),
});

export type CreateProductPayload = z.infer<typeof createProductSchema>;
export type UpdateProductPayload = z.infer<typeof updateProductSchema>;
export type GetProductsTableQuery = z.infer<typeof getProductsTableSchema>;
export type UpdateProductsTablePayload = z.infer<typeof updateProductsTableSchema>;
