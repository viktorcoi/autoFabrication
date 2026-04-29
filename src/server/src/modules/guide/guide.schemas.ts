import { z } from "zod";

const typeProductNameSchema = z
	.string()
	.trim()
	.min(1, "Название типа изделия обязательно")
	.max(255, "Название типа изделия слишком длинное");

const typeProductDescriptionSchema = z
	.string()
	.trim()
	.max(1000, "Описание типа изделия слишком длинное")
	.transform((value) => value.length > 0 ? value : null);

const typeProductsTableSortingSchema = z.object({
	id: z.enum(["name", "description"]),
	sort: z.enum(["asc", "desc"]),
}).strict();

const materialGroupNameSchema = z
	.string()
	.trim()
	.min(1, "Название группы материалов обязательно")
	.max(255, "Название группы материалов слишком длинное");

const materialGroupDescriptionSchema = z
	.string()
	.trim()
	.max(1000, "Описание группы материалов слишком длинное")
	.transform((value) => value.length > 0 ? value : null);

const materialGroupsTableSortingSchema = z.object({
	id: z.enum(["name", "description"]),
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

export const createTypeProductSchema = z.object({
	name: typeProductNameSchema,
	description: typeProductDescriptionSchema.optional(),
});

export const updateTypeProductSchema = z
	.object({
		name: typeProductNameSchema.optional(),
		description: typeProductDescriptionSchema.optional(),
	})
	.refine(
		(value) => value.name !== undefined || value.description !== undefined,
		"Нужно передать хотя бы одно поле для обновления",
	);

export const updateTypeProductsTableItemSchema = z
	.object({
		name: typeProductNameSchema.optional(),
		description: typeProductDescriptionSchema.optional(),
	})
	.strict()
	.refine(
		(value) => Object.keys(value).length > 0,
		"Нет данных для обновления",
	);

export const updateTypeProductsTableSchema = z
	.record(
		z.string().regex(/^[1-9]\d*$/, "Некорректный id типа изделия"),
		z.unknown(),
	)
	.refine(
		(value) => Object.keys(value).length > 0,
		"Нужно передать хотя бы одну строку для редактирования",
	);

export const deleteTypeProductIdsSchema = z
	.array(
		z.coerce
			.number()
			.int()
			.positive("id типа изделия должен быть положительным числом"),
	)
	.min(1, "Нужно выбрать хотя бы один тип изделия");

export const getTypeProductsTableSchema = z.object({
	page: z.coerce.number().int().min(0).default(0),
	rows: z.coerce.number().int().positive().max(100).default(20),
	search: z.preprocess(
		(value) => typeof value === "string" ? value.trim() : undefined,
		z.string().optional(),
	).transform((value) => value && value.length > 0 ? value : undefined),
	sorting: z
		.preprocess(parseTableSorting, typeProductsTableSortingSchema.nullable())
		.optional()
		.transform((value) => value ?? null),
});

export const createMaterialGroupSchema = z.object({
	name: materialGroupNameSchema,
	description: materialGroupDescriptionSchema.optional(),
});

export const updateMaterialGroupSchema = z
	.object({
		name: materialGroupNameSchema.optional(),
		description: materialGroupDescriptionSchema.optional(),
	})
	.refine(
		(value) => value.name !== undefined || value.description !== undefined,
		"Нужно передать хотя бы одно поле для обновления",
	);

export const updateMaterialGroupsTableItemSchema = z
	.object({
		name: materialGroupNameSchema.optional(),
		description: materialGroupDescriptionSchema.optional(),
	})
	.strict()
	.refine(
		(value) => Object.keys(value).length > 0,
		"Нет данных для обновления",
	);

export const updateMaterialGroupsTableSchema = z
	.record(
		z.string().regex(/^[1-9]\d*$/, "Некорректный id группы материалов"),
		z.unknown(),
	)
	.refine(
		(value) => Object.keys(value).length > 0,
		"Нужно передать хотя бы одну строку для редактирования",
	);

export const deleteMaterialGroupIdsSchema = z
	.array(
		z.coerce
			.number()
			.int()
			.positive("id группы материалов должен быть положительным числом"),
	)
	.min(1, "Нужно выбрать хотя бы одну группу материалов");

export const getMaterialGroupsTableSchema = z.object({
	page: z.coerce.number().int().min(0).default(0),
	rows: z.coerce.number().int().positive().max(100).default(20),
	search: z.preprocess(
		(value) => typeof value === "string" ? value.trim() : undefined,
		z.string().optional(),
	).transform((value) => value && value.length > 0 ? value : undefined),
	sorting: z
		.preprocess(parseTableSorting, materialGroupsTableSortingSchema.nullable())
		.optional()
		.transform((value) => value ?? null),
});

export type GetTypeProductsTableQuery = z.infer<typeof getTypeProductsTableSchema>;
export type UpdateTypeProductsTablePayload = z.infer<typeof updateTypeProductsTableSchema>;
export type GetMaterialGroupsTableQuery = z.infer<typeof getMaterialGroupsTableSchema>;
export type UpdateMaterialGroupsTablePayload = z.infer<typeof updateMaterialGroupsTableSchema>;
