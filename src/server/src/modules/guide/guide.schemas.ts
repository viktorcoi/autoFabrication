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
	.min(1, "Название группы материала обязательно")
	.max(255, "Название группы материала слишком длинное");

const materialGroupDescriptionSchema = z
	.string()
	.trim()
	.max(1000, "Описание группы материала слишком длинное")
	.transform((value) => value.length > 0 ? value : null);

const materialGroupsTableSortingSchema = z.object({
	id: z.enum(["name", "description"]),
	sort: z.enum(["asc", "desc"]),
}).strict();

const operationGroupNameSchema = z
	.string()
	.trim()
	.min(1, "Название группы операций обязательно")
	.max(255, "Название группы операций слишком длинное");

const operationGroupDescriptionSchema = z
	.string()
	.trim()
	.max(1000, "Описание группы операций слишком длинное")
	.transform((value) => value.length > 0 ? value : null);

const operationGroupsTableSortingSchema = z.object({
	id: z.enum(["name", "description"]),
	sort: z.enum(["asc", "desc"]),
}).strict();

const materialNameSchema = z
	.string()
	.trim()
	.min(1, "Название материала обязательно")
	.max(255, "Название материала слишком длинное");

const materialDescriptionSchema = z
	.string()
	.trim()
	.max(1000, "Описание материала слишком длинное")
	.transform((value) => value.length > 0 ? value : null);

const materialGroupIdSchema = z.coerce
	.number()
	.int()
	.positive("Некорректный id группы материала");

const materialsTableSortingSchema = z.object({
	id: z.enum(["name", "materialGroup", "description"]),
	sort: z.enum(["asc", "desc"]),
}).strict();

const operationNameSchema = z
	.string()
	.trim()
	.min(1, "Название операции обязательно")
	.max(255, "Название операции слишком длинное");

const operationDescriptionSchema = z
	.string()
	.trim()
	.max(1000, "Описание операции слишком длинное")
	.transform((value) => value.length > 0 ? value : null);

const operationGroupIdSchema = z.coerce
	.number()
	.int()
	.positive("Некорректный id группы операций");

const operationsTableSortingSchema = z.object({
	id: z.enum(["name", "operationGroup", "download", "description"]),
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
		z.string().regex(/^[1-9]\d*$/, "Некорректный id группы материала"),
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
			.positive("id группы материала должен быть положительным числом"),
	)
	.min(1, "Нужно выбрать хотя бы одну группу материала");

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

export const createOperationGroupSchema = z.object({
	name: operationGroupNameSchema,
	description: operationGroupDescriptionSchema.optional(),
});

export const updateOperationGroupSchema = z
	.object({
		name: operationGroupNameSchema.optional(),
		description: operationGroupDescriptionSchema.optional(),
	})
	.refine(
		(value) => value.name !== undefined || value.description !== undefined,
		"Нужно передать хотя бы одно поле для обновления",
	);

export const updateOperationGroupsTableItemSchema = z
	.object({
		name: operationGroupNameSchema.optional(),
		description: operationGroupDescriptionSchema.optional(),
	})
	.strict()
	.refine(
		(value) => Object.keys(value).length > 0,
		"Нет данных для обновления",
	);

export const updateOperationGroupsTableSchema = z
	.record(
		z.string().regex(/^[1-9]\d*$/, "Некорректный id группы операций"),
		z.unknown(),
	)
	.refine(
		(value) => Object.keys(value).length > 0,
		"Нужно передать хотя бы одну строку для редактирования",
	);

export const deleteOperationGroupIdsSchema = z
	.array(
		z.coerce
			.number()
			.int()
			.positive("id группы операций должен быть положительным числом"),
	)
	.min(1, "Нужно выбрать хотя бы одну группу операций");

export const getOperationGroupsTableSchema = z.object({
	page: z.coerce.number().int().min(0).default(0),
	rows: z.coerce.number().int().positive().max(100).default(20),
	search: z.preprocess(
		(value) => typeof value === "string" ? value.trim() : undefined,
		z.string().optional(),
	).transform((value) => value && value.length > 0 ? value : undefined),
	sorting: z
		.preprocess(parseTableSorting, operationGroupsTableSortingSchema.nullable())
		.optional()
		.transform((value) => value ?? null),
});

export const createMaterialSchema = z.object({
	materialGroupId: materialGroupIdSchema,
	name: materialNameSchema,
	description: materialDescriptionSchema.optional(),
});

export const updateMaterialSchema = z
	.object({
		materialGroupId: materialGroupIdSchema.optional(),
		name: materialNameSchema.optional(),
		description: materialDescriptionSchema.optional(),
	})
	.refine(
		(value) => (
			value.materialGroupId !== undefined
			|| value.name !== undefined
			|| value.description !== undefined
		),
		"Нужно передать хотя бы одно поле для обновления",
	);

export const updateMaterialsTableItemSchema = z
	.object({
		name: materialNameSchema.optional(),
		description: materialDescriptionSchema.optional(),
	})
	.strict()
	.refine(
		(value) => Object.keys(value).length > 0,
		"Нет данных для обновления",
	);

export const updateMaterialsTableSchema = z
	.record(
		z.string().regex(/^[1-9]\d*$/, "Некорректный id материала"),
		z.unknown(),
	)
	.refine(
		(value) => Object.keys(value).length > 0,
		"Нужно передать хотя бы одну строку для редактирования",
	);

export const deleteMaterialIdsSchema = z
	.array(
		z.coerce
			.number()
			.int()
			.positive("id материала должен быть положительным числом"),
	)
	.min(1, "Нужно выбрать хотя бы один материал");

export const getMaterialsTableSchema = z.object({
	page: z.coerce.number().int().min(0).default(0),
	rows: z.coerce.number().int().positive().max(100).default(20),
	search: z.preprocess(
		(value) => typeof value === "string" ? value.trim() : undefined,
		z.string().optional(),
	).transform((value) => value && value.length > 0 ? value : undefined),
	sorting: z
		.preprocess(parseTableSorting, materialsTableSortingSchema.nullable())
		.optional()
		.transform((value) => value ?? null),
});

export const createOperationSchema = z.object({
	operationGroupId: operationGroupIdSchema,
	name: operationNameSchema,
	description: operationDescriptionSchema.optional(),
});

export const updateOperationSchema = z
	.object({
		operationGroupId: operationGroupIdSchema.optional(),
		name: operationNameSchema.optional(),
		description: operationDescriptionSchema.optional(),
		removedFileIds: z.preprocess(
			parseIdArray,
			z.array(
				z.coerce
					.number()
					.int()
					.positive("Некорректный id файла операции"),
			).max(10, "Нельзя удалить больше 10 файлов за один запрос").optional(),
		),
	})
	.strict();

export const updateOperationsTableItemSchema = z
	.object({
		name: operationNameSchema.optional(),
		description: operationDescriptionSchema.optional(),
	})
	.strict()
	.refine(
		(value) => Object.keys(value).length > 0,
		"Нет данных для обновления",
	);

export const updateOperationsTableSchema = z
	.record(
		z.string().regex(/^[1-9]\d*$/, "Некорректный id операции"),
		z.unknown(),
	)
	.refine(
		(value) => Object.keys(value).length > 0,
		"Нужно передать хотя бы одну строку для редактирования",
	);

export const deleteOperationIdsSchema = z
	.array(
		z.coerce
			.number()
			.int()
			.positive("id операции должен быть положительным числом"),
	)
	.min(1, "Нужно выбрать хотя бы одну операцию");

export const getOperationsTableSchema = z.object({
	page: z.coerce.number().int().min(0).default(0),
	rows: z.coerce.number().int().positive().max(100).default(20),
	search: z.preprocess(
		(value) => typeof value === "string" ? value.trim() : undefined,
		z.string().optional(),
	).transform((value) => value && value.length > 0 ? value : undefined),
	sorting: z
		.preprocess(parseTableSorting, operationsTableSortingSchema.nullable())
		.optional()
		.transform((value) => value ?? null),
});

export type GetTypeProductsTableQuery = z.infer<typeof getTypeProductsTableSchema>;
export type UpdateTypeProductsTablePayload = z.infer<typeof updateTypeProductsTableSchema>;
export type GetMaterialGroupsTableQuery = z.infer<typeof getMaterialGroupsTableSchema>;
export type UpdateMaterialGroupsTablePayload = z.infer<typeof updateMaterialGroupsTableSchema>;
export type GetOperationGroupsTableQuery = z.infer<typeof getOperationGroupsTableSchema>;
export type UpdateOperationGroupsTablePayload = z.infer<typeof updateOperationGroupsTableSchema>;
export type GetMaterialsTableQuery = z.infer<typeof getMaterialsTableSchema>;
export type UpdateMaterialsTablePayload = z.infer<typeof updateMaterialsTableSchema>;
export type GetOperationsTableQuery = z.infer<typeof getOperationsTableSchema>;
export type UpdateOperationsTablePayload = z.infer<typeof updateOperationsTableSchema>;
