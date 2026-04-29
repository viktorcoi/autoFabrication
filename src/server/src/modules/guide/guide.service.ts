import type { Prisma } from "../../generated/prisma/client.js";
import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../shared/errors/app-error.js";
import { hasPermission } from "../../shared/http/permissions.js";
import type { RolePermissions } from "../roles/role.types.js";
import {
	updateMaterialGroupsTableItemSchema,
	updateMaterialsTableItemSchema,
	updateOperationGroupsTableItemSchema,
	updateTypeProductsTableItemSchema,
} from "./guide.schemas.js";
import type {
	GetMaterialGroupsTableQuery,
	GetMaterialsTableQuery,
	GetOperationGroupsTableQuery,
	GetTypeProductsTableQuery,
	UpdateMaterialGroupsTablePayload,
	UpdateMaterialsTablePayload,
	UpdateOperationGroupsTablePayload,
	UpdateTypeProductsTablePayload,
} from "./guide.schemas.js";

const typeProductSelect = {
	id: true,
	name: true,
	description: true,
	createdAt: true,
	updatedAt: true,
} satisfies Prisma.TypeProductSelect;

const typeProductTableSelect = {
	id: true,
	name: true,
	description: true,
} satisfies Prisma.TypeProductSelect;

const materialGroupListSelect = {
	id: true,
	name: true,
} satisfies Prisma.materialGroupSelect;

const materialGroupSelect = {
	id: true,
	name: true,
	description: true,
	createdAt: true,
	updatedAt: true,
} satisfies Prisma.materialGroupSelect;

const materialGroupTableSelect = {
	id: true,
	name: true,
	description: true,
} satisfies Prisma.materialGroupSelect;

const operationGroupSelect = {
	id: true,
	name: true,
	description: true,
	createdAt: true,
	updatedAt: true,
} satisfies Prisma.operationGroupSelect;

const operationGroupTableSelect = {
	id: true,
	name: true,
	description: true,
} satisfies Prisma.operationGroupSelect;

const materialSelect = {
	id: true,
	name: true,
	description: true,
	materialGroupId: true,
	createdAt: true,
	updatedAt: true,
	materialGroup: {
		select: {
			id: true,
			name: true,
			description: true,
		},
	},
} satisfies Prisma.materialSelect;

const materialTableSelect = {
	id: true,
	name: true,
	description: true,
	materialGroup: {
		select: {
			name: true,
		},
	},
} satisfies Prisma.materialSelect;

const TYPE_PRODUCT_TABLE_FIELD_TO_MODEL_FIELD = {
	id: "id",
	name: "name",
	description: "description",
} as const;

const MATERIAL_GROUP_TABLE_FIELD_TO_MODEL_FIELD = {
	id: "id",
	name: "name",
	description: "description",
} as const;

const OPERATION_GROUP_TABLE_FIELD_TO_MODEL_FIELD = {
	id: "id",
	name: "name",
	description: "description",
} as const;

const MATERIAL_TABLE_FIELD_TO_MODEL_FIELD = {
	id: "id",
	name: "name",
	materialGroup: "materialGroupId",
	description: "description",
} as const;

const TYPE_PRODUCT_OPTIONAL_MODEL_FIELDS = new Set<string>(["description"]);
const TYPE_PRODUCT_SYSTEM_MODEL_FIELDS = new Set<string>(["id", "createdAt", "updatedAt"]);
const MATERIAL_GROUP_OPTIONAL_MODEL_FIELDS = new Set<string>(["description"]);
const MATERIAL_GROUP_SYSTEM_MODEL_FIELDS = new Set<string>(["id", "createdAt", "updatedAt"]);
const OPERATION_GROUP_OPTIONAL_MODEL_FIELDS = new Set<string>(["description"]);
const OPERATION_GROUP_SYSTEM_MODEL_FIELDS = new Set<string>(["id", "createdAt", "updatedAt"]);
const MATERIAL_OPTIONAL_MODEL_FIELDS = new Set<string>(["description"]);
const MATERIAL_SYSTEM_MODEL_FIELDS = new Set<string>(["id", "createdAt", "updatedAt"]);
const MATERIAL_READONLY_TABLE_FIELDS = new Set<string>(["materialGroup"]);

const typeProductTableMeta = Object.freeze({
	isConst: Object.freeze(
		Object.entries(TYPE_PRODUCT_TABLE_FIELD_TO_MODEL_FIELD)
			.filter(([, modelField]) => TYPE_PRODUCT_SYSTEM_MODEL_FIELDS.has(modelField))
			.map(([columnId]) => columnId),
	),
	isRequired: Object.freeze(
		Object.entries(TYPE_PRODUCT_TABLE_FIELD_TO_MODEL_FIELD)
			.filter(([, modelField]) => !TYPE_PRODUCT_OPTIONAL_MODEL_FIELDS.has(modelField))
			.filter(([, modelField]) => !TYPE_PRODUCT_SYSTEM_MODEL_FIELDS.has(modelField))
			.map(([columnId]) => columnId),
	),
});

const materialGroupTableMeta = Object.freeze({
	isConst: Object.freeze(
		Object.entries(MATERIAL_GROUP_TABLE_FIELD_TO_MODEL_FIELD)
			.filter(([, modelField]) => MATERIAL_GROUP_SYSTEM_MODEL_FIELDS.has(modelField))
			.map(([columnId]) => columnId),
	),
	isRequired: Object.freeze(
		Object.entries(MATERIAL_GROUP_TABLE_FIELD_TO_MODEL_FIELD)
			.filter(([, modelField]) => !MATERIAL_GROUP_OPTIONAL_MODEL_FIELDS.has(modelField))
			.filter(([, modelField]) => !MATERIAL_GROUP_SYSTEM_MODEL_FIELDS.has(modelField))
			.map(([columnId]) => columnId),
	),
});

const operationGroupTableMeta = Object.freeze({
	isConst: Object.freeze(
		Object.entries(OPERATION_GROUP_TABLE_FIELD_TO_MODEL_FIELD)
			.filter(([, modelField]) => OPERATION_GROUP_SYSTEM_MODEL_FIELDS.has(modelField))
			.map(([columnId]) => columnId),
	),
	isRequired: Object.freeze(
		Object.entries(OPERATION_GROUP_TABLE_FIELD_TO_MODEL_FIELD)
			.filter(([, modelField]) => !OPERATION_GROUP_OPTIONAL_MODEL_FIELDS.has(modelField))
			.filter(([, modelField]) => !OPERATION_GROUP_SYSTEM_MODEL_FIELDS.has(modelField))
			.map(([columnId]) => columnId),
	),
});

const materialTableMeta = Object.freeze({
	isConst: Object.freeze(
		Object.entries(MATERIAL_TABLE_FIELD_TO_MODEL_FIELD)
			.filter(([columnId, modelField]) => (
				MATERIAL_SYSTEM_MODEL_FIELDS.has(modelField) || MATERIAL_READONLY_TABLE_FIELDS.has(columnId)
			))
			.map(([columnId]) => columnId),
	),
	isRequired: Object.freeze(
		Object.entries(MATERIAL_TABLE_FIELD_TO_MODEL_FIELD)
			.filter(([columnId, modelField]) => (
				!MATERIAL_OPTIONAL_MODEL_FIELDS.has(modelField)
				&& !MATERIAL_SYSTEM_MODEL_FIELDS.has(modelField)
				&& !MATERIAL_READONLY_TABLE_FIELDS.has(columnId)
			))
			.map(([columnId]) => columnId),
	),
});

type CreateTypeProductData = {
	name: string;
	description?: string | null;
};

type UpdateTypeProductData = Partial<CreateTypeProductData>;

type CreateMaterialGroupData = {
	name: string;
	description?: string | null;
};

type UpdateMaterialGroupData = Partial<CreateMaterialGroupData>;

type CreateOperationGroupData = {
	name: string;
	description?: string | null;
};

type UpdateOperationGroupData = Partial<CreateOperationGroupData>;

type CreateMaterialData = {
	name: string;
	description?: string | null;
	materialGroupId: number;
};

type UpdateMaterialData = Partial<CreateMaterialData>;

type ActionByTableResultItem = {
	id: number;
	description: string;
};

export type ActionByTableResult = {
	success: ActionByTableResultItem[];
	error: ActionByTableResultItem[];
};

const TYPE_PRODUCT_NOT_FOUND_ERROR = "Тип изделия не найден";
const TYPE_PRODUCT_DUPLICATE_ERROR = "Тип изделия с таким названием уже существует";
const UPDATE_TYPE_PRODUCT_NO_RIGHTS_ERROR = "У вас нет прав для редактирования";
const UPDATE_TYPE_PRODUCT_SUCCESS_DESCRIPTION = "Отредактировано";
const DELETE_TYPE_PRODUCT_NO_RIGHTS_ERROR = "У вас нет прав для удаления";
const DELETE_TYPE_PRODUCT_IN_USE_ERROR = "Этот тип изделия используется и не может быть удален";

const MATERIAL_GROUP_NOT_FOUND_ERROR = "Группа материала не найдена";
const MATERIAL_GROUP_DUPLICATE_ERROR = "Группа материала с таким названием уже существует";
const UPDATE_MATERIAL_GROUP_NO_RIGHTS_ERROR = "У вас нет прав для редактирования";
const UPDATE_MATERIAL_GROUP_SUCCESS_DESCRIPTION = "Отредактировано";
const DELETE_MATERIAL_GROUP_NO_RIGHTS_ERROR = "У вас нет прав для удаления";
const DELETE_MATERIAL_GROUP_IN_USE_ERROR = "Эта группа материала используется и не может быть удалена";

const OPERATION_GROUP_NOT_FOUND_ERROR = "Группа операций не найдена";
const OPERATION_GROUP_DUPLICATE_ERROR = "Группа операций с таким названием уже существует";
const UPDATE_OPERATION_GROUP_NO_RIGHTS_ERROR = "У вас нет прав для редактирования";
const UPDATE_OPERATION_GROUP_SUCCESS_DESCRIPTION = "Отредактировано";
const DELETE_OPERATION_GROUP_NO_RIGHTS_ERROR = "У вас нет прав для удаления";
const DELETE_OPERATION_GROUP_IN_USE_ERROR = "Эта группа операций используется и не может быть удалена";

const MATERIAL_NOT_FOUND_ERROR = "Материал не найден";
const MATERIAL_DUPLICATE_ERROR = "Материал с таким названием уже существует";
const UPDATE_MATERIAL_NO_RIGHTS_ERROR = "У вас нет прав для редактирования";
const UPDATE_MATERIAL_SUCCESS_DESCRIPTION = "Отредактировано";
const DELETE_MATERIAL_NO_RIGHTS_ERROR = "У вас нет прав для удаления";
const DELETE_MATERIAL_IN_USE_ERROR = "Этот материал используется и не может быть удален";

const getUniqueIds = (ids: number[]) => {
	const uniqueIds = new Set<number>();

	return ids.filter((id) => {
		if (uniqueIds.has(id)) {
			return false;
		}

		uniqueIds.add(id);
		return true;
	});
};

const getValidationErrorMessage = (issues: Array<{ message: string }>) => {
	const messages = issues
		.map((issue) => issue.message.trim())
		.filter(Boolean);

	return Array.from(new Set(messages)).join(" / ");
};

const isPrismaDeleteConstraintError = (error: unknown) =>
	Boolean(
		error
		&& typeof error === "object"
		&& "code" in error
		&& (error.code === "P2003" || error.code === "P2014"),
	);

const isPrismaRecordNotFoundError = (error: unknown) =>
	Boolean(
		error
		&& typeof error === "object"
		&& "code" in error
		&& error.code === "P2025",
	);

const buildTypeProductsTableWhere = (search?: string): Prisma.TypeProductWhereInput | undefined => {
	if (!search) {
		return undefined;
	}

	return {
		OR: [
			{
				name: {
					contains: search,
					mode: "insensitive",
				},
			},
			{
				description: {
					contains: search,
					mode: "insensitive",
				},
			},
		],
	};
};

const buildMaterialGroupsTableWhere = (search?: string): Prisma.materialGroupWhereInput | undefined => {
	if (!search) {
		return undefined;
	}

	return {
		OR: [
			{
				name: {
					contains: search,
					mode: "insensitive",
				},
			},
			{
				description: {
					contains: search,
					mode: "insensitive",
				},
			},
		],
	};
};

const buildOperationGroupsTableWhere = (search?: string): Prisma.operationGroupWhereInput | undefined => {
	if (!search) {
		return undefined;
	}

	return {
		OR: [
			{
				name: {
					contains: search,
					mode: "insensitive",
				},
			},
			{
				description: {
					contains: search,
					mode: "insensitive",
				},
			},
		],
	};
};

const buildMaterialsTableWhere = (search?: string): Prisma.materialWhereInput | undefined => {
	if (!search) {
		return undefined;
	}

	return {
		OR: [
			{
				name: {
					contains: search,
					mode: "insensitive",
				},
			},
			{
				description: {
					contains: search,
					mode: "insensitive",
				},
			},
			{
				materialGroup: {
					is: {
						name: {
							contains: search,
							mode: "insensitive",
						},
					},
				},
			},
		],
	};
};

const buildTypeProductsTableOrderBy = (
	sorting: GetTypeProductsTableQuery["sorting"],
): Prisma.TypeProductOrderByWithRelationInput[] => {
	if (!sorting) {
		return [{ id: "asc" }];
	}

	return [
		{ [sorting.id]: sorting.sort } as Prisma.TypeProductOrderByWithRelationInput,
		{ id: "asc" },
	];
};

const buildMaterialGroupsTableOrderBy = (
	sorting: GetMaterialGroupsTableQuery["sorting"],
): Prisma.materialGroupOrderByWithRelationInput[] => {
	if (!sorting) {
		return [{ id: "asc" }];
	}

	return [
		{ [sorting.id]: sorting.sort } as Prisma.materialGroupOrderByWithRelationInput,
		{ id: "asc" },
	];
};

const buildOperationGroupsTableOrderBy = (
	sorting: GetOperationGroupsTableQuery["sorting"],
): Prisma.operationGroupOrderByWithRelationInput[] => {
	if (!sorting) {
		return [{ id: "asc" }];
	}

	return [
		{ [sorting.id]: sorting.sort } as Prisma.operationGroupOrderByWithRelationInput,
		{ id: "asc" },
	];
};

const buildMaterialsTableOrderBy = (
	sorting: GetMaterialsTableQuery["sorting"],
): Prisma.materialOrderByWithRelationInput[] => {
	if (!sorting) {
		return [{ id: "asc" }];
	}

	switch (sorting.id) {
		case "materialGroup":
			return [
				{ materialGroup: { name: sorting.sort } },
				{ id: "asc" },
			];
		default:
			return [
				{ [sorting.id]: sorting.sort } as Prisma.materialOrderByWithRelationInput,
				{ id: "asc" },
			];
	}
};

const ensureTypeProductNameIsUnique = async (name: string, excludedId?: number) => {
	const existingTypeProduct = await prisma.typeProduct.findUnique({
		where: { name },
		select: { id: true },
	});

	if (existingTypeProduct && existingTypeProduct.id !== excludedId) {
		throw new AppError(409, TYPE_PRODUCT_DUPLICATE_ERROR);
	}
};

const ensureMaterialGroupNameIsUnique = async (name: string, excludedId?: number) => {
	const existingMaterialGroup = await prisma.materialGroup.findUnique({
		where: { name },
		select: { id: true },
	});

	if (existingMaterialGroup && existingMaterialGroup.id !== excludedId) {
		throw new AppError(409, MATERIAL_GROUP_DUPLICATE_ERROR);
	}
};

const ensureOperationGroupNameIsUnique = async (name: string, excludedId?: number) => {
	const existingOperationGroup = await prisma.operationGroup.findUnique({
		where: { name },
		select: { id: true },
	});

	if (existingOperationGroup && existingOperationGroup.id !== excludedId) {
		throw new AppError(409, OPERATION_GROUP_DUPLICATE_ERROR);
	}
};

const ensureMaterialNameIsUnique = async (name: string, excludedId?: number) => {
	const existingMaterial = await prisma.material.findUnique({
		where: { name },
		select: { id: true },
	});

	if (existingMaterial && existingMaterial.id !== excludedId) {
		throw new AppError(409, MATERIAL_DUPLICATE_ERROR);
	}
};

const getGuidePermissions = async (actorId: number) => {
	const actor = await prisma.user.findUnique({
		where: { id: actorId },
		select: {
			role: {
				select: {
					permissions: true,
				},
			},
		},
	});

	if (!actor) {
		throw new AppError(404, "Пользователь не найден");
	}

	return actor.role.permissions as RolePermissions;
};

export const listMaterialGroups = async (search?: string) =>
	prisma.materialGroup.findMany({
		where: search
			? {
					name: {
						contains: search,
						mode: "insensitive",
					},
				}
			: undefined,
		select: materialGroupListSelect,
		orderBy: {
			id: "asc",
		},
	});

export const getTypeProductsTable = async (query: GetTypeProductsTableQuery) => {
	const where = buildTypeProductsTableWhere(query.search);
	const orderBy = buildTypeProductsTableOrderBy(query.sorting);
	const skip = query.page * query.rows;
	const [total, typeProducts] = await prisma.$transaction([
		prisma.typeProduct.count({ where }),
		prisma.typeProduct.findMany({
			where,
			select: typeProductTableSelect,
			orderBy,
			skip,
			take: query.rows,
		}),
	]);

	return {
		total,
		data: typeProducts.map((typeProduct) => ({
			id: typeProduct.id,
			name: typeProduct.name,
			...(typeProduct.description ? { description: typeProduct.description } : {}),
			isConst: [...typeProductTableMeta.isConst],
			isRequired: [...typeProductTableMeta.isRequired],
		})),
	};
};

export const getMaterialGroupsTable = async (query: GetMaterialGroupsTableQuery) => {
	const where = buildMaterialGroupsTableWhere(query.search);
	const orderBy = buildMaterialGroupsTableOrderBy(query.sorting);
	const skip = query.page * query.rows;
	const [total, materialGroups] = await prisma.$transaction([
		prisma.materialGroup.count({ where }),
		prisma.materialGroup.findMany({
			where,
			select: materialGroupTableSelect,
			orderBy,
			skip,
			take: query.rows,
		}),
	]);

	return {
		total,
		data: materialGroups.map((materialGroup) => ({
			id: materialGroup.id,
			name: materialGroup.name,
			...(materialGroup.description ? { description: materialGroup.description } : {}),
			isConst: [...materialGroupTableMeta.isConst],
			isRequired: [...materialGroupTableMeta.isRequired],
		})),
	};
};

export const getOperationGroupsTable = async (query: GetOperationGroupsTableQuery) => {
	const where = buildOperationGroupsTableWhere(query.search);
	const orderBy = buildOperationGroupsTableOrderBy(query.sorting);
	const skip = query.page * query.rows;
	const [total, operationGroups] = await prisma.$transaction([
		prisma.operationGroup.count({ where }),
		prisma.operationGroup.findMany({
			where,
			select: operationGroupTableSelect,
			orderBy,
			skip,
			take: query.rows,
		}),
	]);

	return {
		total,
		data: operationGroups.map((operationGroup) => ({
			id: operationGroup.id,
			name: operationGroup.name,
			...(operationGroup.description ? { description: operationGroup.description } : {}),
			isConst: [...operationGroupTableMeta.isConst],
			isRequired: [...operationGroupTableMeta.isRequired],
		})),
	};
};

export const getMaterialsTable = async (query: GetMaterialsTableQuery) => {
	const where = buildMaterialsTableWhere(query.search);
	const orderBy = buildMaterialsTableOrderBy(query.sorting);
	const skip = query.page * query.rows;
	const [total, materials] = await prisma.$transaction([
		prisma.material.count({ where }),
		prisma.material.findMany({
			where,
			select: materialTableSelect,
			orderBy,
			skip,
			take: query.rows,
		}),
	]);

	return {
		total,
		data: materials.map((material) => ({
			id: material.id,
			name: material.name,
			materialGroup: material.materialGroup.name,
			...(material.description ? { description: material.description } : {}),
			isConst: [...materialTableMeta.isConst],
			isRequired: [...materialTableMeta.isRequired],
		})),
	};
};

export const getTypeProductById = async (id: number) => {
	const typeProduct = await prisma.typeProduct.findUnique({
		where: { id },
		select: typeProductSelect,
	});

	if (!typeProduct) {
		throw new AppError(404, TYPE_PRODUCT_NOT_FOUND_ERROR);
	}

	return typeProduct;
};

export const getMaterialGroupById = async (id: number) => {
	const materialGroup = await prisma.materialGroup.findUnique({
		where: { id },
		select: materialGroupSelect,
	});

	if (!materialGroup) {
		throw new AppError(404, MATERIAL_GROUP_NOT_FOUND_ERROR);
	}

	return materialGroup;
};

export const getOperationGroupById = async (id: number) => {
	const operationGroup = await prisma.operationGroup.findUnique({
		where: { id },
		select: operationGroupSelect,
	});

	if (!operationGroup) {
		throw new AppError(404, OPERATION_GROUP_NOT_FOUND_ERROR);
	}

	return operationGroup;
};

export const getMaterialById = async (id: number) => {
	const material = await prisma.material.findUnique({
		where: { id },
		select: materialSelect,
	});

	if (!material) {
		throw new AppError(404, MATERIAL_NOT_FOUND_ERROR);
	}

	return material;
};

export const createTypeProduct = async (data: CreateTypeProductData) => {
	await ensureTypeProductNameIsUnique(data.name);

	return prisma.typeProduct.create({
		data: {
			name: data.name,
			description: data.description,
		},
		select: typeProductSelect,
	});
};

export const createMaterialGroup = async (data: CreateMaterialGroupData) => {
	await ensureMaterialGroupNameIsUnique(data.name);

	return prisma.materialGroup.create({
		data: {
			name: data.name,
			description: data.description,
		},
		select: materialGroupSelect,
	});
};

export const createOperationGroup = async (data: CreateOperationGroupData) => {
	await ensureOperationGroupNameIsUnique(data.name);

	return prisma.operationGroup.create({
		data: {
			name: data.name,
			description: data.description,
		},
		select: operationGroupSelect,
	});
};

export const createMaterial = async (data: CreateMaterialData) => {
	await ensureMaterialNameIsUnique(data.name);
	await getMaterialGroupById(data.materialGroupId);

	return prisma.material.create({
		data: {
			name: data.name,
			description: data.description,
			materialGroup: {
				connect: {
					id: data.materialGroupId,
				},
			},
		},
		select: materialSelect,
	});
};

export const updateTypeProduct = async (id: number, data: UpdateTypeProductData) => {
	await getTypeProductById(id);

	if (typeof data.name === "string") {
		await ensureTypeProductNameIsUnique(data.name, id);
	}

	return prisma.typeProduct.update({
		where: { id },
		data: {
			name: data.name,
			description: data.description,
		},
		select: typeProductSelect,
	});
};

export const updateMaterialGroup = async (id: number, data: UpdateMaterialGroupData) => {
	await getMaterialGroupById(id);

	if (typeof data.name === "string") {
		await ensureMaterialGroupNameIsUnique(data.name, id);
	}

	return prisma.materialGroup.update({
		where: { id },
		data: {
			name: data.name,
			description: data.description,
		},
		select: materialGroupSelect,
	});
};

export const updateOperationGroup = async (id: number, data: UpdateOperationGroupData) => {
	await getOperationGroupById(id);

	if (typeof data.name === "string") {
		await ensureOperationGroupNameIsUnique(data.name, id);
	}

	return prisma.operationGroup.update({
		where: { id },
		data: {
			name: data.name,
			description: data.description,
		},
		select: operationGroupSelect,
	});
};

export const updateMaterial = async (id: number, data: UpdateMaterialData) => {
	await getMaterialById(id);

	if (typeof data.name === "string") {
		await ensureMaterialNameIsUnique(data.name, id);
	}

	if (typeof data.materialGroupId === "number") {
		await getMaterialGroupById(data.materialGroupId);
	}

	return prisma.material.update({
		where: { id },
		data: {
			name: data.name,
			description: data.description,
			...(typeof data.materialGroupId === "number"
				? {
						materialGroup: {
							connect: {
								id: data.materialGroupId,
							},
						},
					}
				: {}),
		},
		select: materialSelect,
	});
};

export const updateTypeProductsTable = async (
	payload: UpdateTypeProductsTablePayload,
	actorId: number,
): Promise<ActionByTableResult> => {
	const permissions = await getGuidePermissions(actorId);
	const ids = Object.keys(payload).map((id) => Number(id));

	if (!hasPermission(permissions, "/guide", "editing")) {
		return {
			success: [],
			error: ids.map((id) => ({
				id,
				description: UPDATE_TYPE_PRODUCT_NO_RIGHTS_ERROR,
			})),
		};
	}

	const result: ActionByTableResult = {
		success: [],
		error: [],
	};

	for (const [rawId, rawItem] of Object.entries(payload)) {
		const id = Number(rawId);
		const parsedItem = updateTypeProductsTableItemSchema.safeParse(rawItem);

		if (!parsedItem.success) {
			result.error.push({
				id,
				description: getValidationErrorMessage(parsedItem.error.issues) || "Некорректные данные",
			});
			continue;
		}

		try {
			await updateTypeProduct(id, parsedItem.data);
			result.success.push({
				id,
				description: UPDATE_TYPE_PRODUCT_SUCCESS_DESCRIPTION,
			});
		} catch (error) {
			if (error instanceof AppError) {
				result.error.push({
					id,
					description: error.message,
				});
				continue;
			}

			throw error;
		}
	}

	return result;
};

export const updateMaterialGroupsTable = async (
	payload: UpdateMaterialGroupsTablePayload,
	actorId: number,
): Promise<ActionByTableResult> => {
	const permissions = await getGuidePermissions(actorId);
	const ids = Object.keys(payload).map((id) => Number(id));

	if (!hasPermission(permissions, "/guide", "editing")) {
		return {
			success: [],
			error: ids.map((id) => ({
				id,
				description: UPDATE_MATERIAL_GROUP_NO_RIGHTS_ERROR,
			})),
		};
	}

	const result: ActionByTableResult = {
		success: [],
		error: [],
	};

	for (const [rawId, rawItem] of Object.entries(payload)) {
		const id = Number(rawId);
		const parsedItem = updateMaterialGroupsTableItemSchema.safeParse(rawItem);

		if (!parsedItem.success) {
			result.error.push({
				id,
				description: getValidationErrorMessage(parsedItem.error.issues) || "Некорректные данные",
			});
			continue;
		}

		try {
			await updateMaterialGroup(id, parsedItem.data);
			result.success.push({
				id,
				description: UPDATE_MATERIAL_GROUP_SUCCESS_DESCRIPTION,
			});
		} catch (error) {
			if (error instanceof AppError) {
				result.error.push({
					id,
					description: error.message,
				});
				continue;
			}

			throw error;
		}
	}

	return result;
};

export const updateOperationGroupsTable = async (
	payload: UpdateOperationGroupsTablePayload,
	actorId: number,
): Promise<ActionByTableResult> => {
	const permissions = await getGuidePermissions(actorId);
	const ids = Object.keys(payload).map((id) => Number(id));

	if (!hasPermission(permissions, "/guide", "editing")) {
		return {
			success: [],
			error: ids.map((id) => ({
				id,
				description: UPDATE_OPERATION_GROUP_NO_RIGHTS_ERROR,
			})),
		};
	}

	const result: ActionByTableResult = {
		success: [],
		error: [],
	};

	for (const [rawId, rawItem] of Object.entries(payload)) {
		const id = Number(rawId);
		const parsedItem = updateOperationGroupsTableItemSchema.safeParse(rawItem);

		if (!parsedItem.success) {
			result.error.push({
				id,
				description: getValidationErrorMessage(parsedItem.error.issues) || "Некорректные данные",
			});
			continue;
		}

		try {
			await updateOperationGroup(id, parsedItem.data);
			result.success.push({
				id,
				description: UPDATE_OPERATION_GROUP_SUCCESS_DESCRIPTION,
			});
		} catch (error) {
			if (error instanceof AppError) {
				result.error.push({
					id,
					description: error.message,
				});
				continue;
			}

			throw error;
		}
	}

	return result;
};

export const updateMaterialsTable = async (
	payload: UpdateMaterialsTablePayload,
	actorId: number,
): Promise<ActionByTableResult> => {
	const permissions = await getGuidePermissions(actorId);
	const ids = Object.keys(payload).map((id) => Number(id));

	if (!hasPermission(permissions, "/guide", "editing")) {
		return {
			success: [],
			error: ids.map((id) => ({
				id,
				description: UPDATE_MATERIAL_NO_RIGHTS_ERROR,
			})),
		};
	}

	const result: ActionByTableResult = {
		success: [],
		error: [],
	};

	for (const [rawId, rawItem] of Object.entries(payload)) {
		const id = Number(rawId);
		const parsedItem = updateMaterialsTableItemSchema.safeParse(rawItem);

		if (!parsedItem.success) {
			result.error.push({
				id,
				description: getValidationErrorMessage(parsedItem.error.issues) || "Некорректные данные",
			});
			continue;
		}

		try {
			await updateMaterial(id, parsedItem.data);
			result.success.push({
				id,
				description: UPDATE_MATERIAL_SUCCESS_DESCRIPTION,
			});
		} catch (error) {
			if (error instanceof AppError) {
				result.error.push({
					id,
					description: error.message,
				});
				continue;
			}

			throw error;
		}
	}

	return result;
};

export const deleteTypeProducts = async (
	ids: number[],
	actorId: number,
): Promise<ActionByTableResult> => {
	const uniqueIds = getUniqueIds(ids);
	const permissions = await getGuidePermissions(actorId);

	if (!hasPermission(permissions, "/guide", "removing")) {
		return {
			success: [],
			error: uniqueIds.map((id) => ({
				id,
				description: DELETE_TYPE_PRODUCT_NO_RIGHTS_ERROR,
			})),
		};
	}

	const existingTypeProducts = await prisma.typeProduct.findMany({
		where: {
			id: {
				in: uniqueIds,
			},
		},
		select: {
			id: true,
		},
	});
	const typeProductsById = new Map(existingTypeProducts.map((typeProduct) => [typeProduct.id, typeProduct]));
	const result: ActionByTableResult = {
		success: [],
		error: [],
	};

	for (const id of uniqueIds) {
		if (!typeProductsById.has(id)) {
			result.error.push({
				id,
				description: TYPE_PRODUCT_NOT_FOUND_ERROR,
			});
			continue;
		}

		try {
			await prisma.typeProduct.delete({
				where: { id },
				select: { id: true },
			});
			result.success.push({
				id,
				description: "Удалено",
			});
		} catch (error) {
			if (isPrismaDeleteConstraintError(error)) {
				result.error.push({
					id,
					description: DELETE_TYPE_PRODUCT_IN_USE_ERROR,
				});
				continue;
			}

			if (isPrismaRecordNotFoundError(error)) {
				result.error.push({
					id,
					description: TYPE_PRODUCT_NOT_FOUND_ERROR,
				});
				continue;
			}

			throw error;
		}
	}

	return result;
};

export const deleteMaterialGroups = async (
	ids: number[],
	actorId: number,
): Promise<ActionByTableResult> => {
	const uniqueIds = getUniqueIds(ids);
	const permissions = await getGuidePermissions(actorId);

	if (!hasPermission(permissions, "/guide", "removing")) {
		return {
			success: [],
			error: uniqueIds.map((id) => ({
				id,
				description: DELETE_MATERIAL_GROUP_NO_RIGHTS_ERROR,
			})),
		};
	}

	const existingMaterialGroups = await prisma.materialGroup.findMany({
		where: {
			id: {
				in: uniqueIds,
			},
		},
		select: {
			id: true,
		},
	});
	const materialGroupsById = new Map(existingMaterialGroups.map((materialGroup) => [materialGroup.id, materialGroup]));
	const result: ActionByTableResult = {
		success: [],
		error: [],
	};

	for (const id of uniqueIds) {
		if (!materialGroupsById.has(id)) {
			result.error.push({
				id,
				description: MATERIAL_GROUP_NOT_FOUND_ERROR,
			});
			continue;
		}

		try {
			await prisma.materialGroup.delete({
				where: { id },
				select: { id: true },
			});
			result.success.push({
				id,
				description: "Удалено",
			});
		} catch (error) {
			if (isPrismaDeleteConstraintError(error)) {
				result.error.push({
					id,
					description: DELETE_MATERIAL_GROUP_IN_USE_ERROR,
				});
				continue;
			}

			if (isPrismaRecordNotFoundError(error)) {
				result.error.push({
					id,
					description: MATERIAL_GROUP_NOT_FOUND_ERROR,
				});
				continue;
			}

			throw error;
		}
	}

	return result;
};

export const deleteOperationGroups = async (
	ids: number[],
	actorId: number,
): Promise<ActionByTableResult> => {
	const uniqueIds = getUniqueIds(ids);
	const permissions = await getGuidePermissions(actorId);

	if (!hasPermission(permissions, "/guide", "removing")) {
		return {
			success: [],
			error: uniqueIds.map((id) => ({
				id,
				description: DELETE_OPERATION_GROUP_NO_RIGHTS_ERROR,
			})),
		};
	}

	const existingOperationGroups = await prisma.operationGroup.findMany({
		where: {
			id: {
				in: uniqueIds,
			},
		},
		select: {
			id: true,
		},
	});
	const operationGroupsById = new Map(existingOperationGroups.map((operationGroup) => [operationGroup.id, operationGroup]));
	const result: ActionByTableResult = {
		success: [],
		error: [],
	};

	for (const id of uniqueIds) {
		if (!operationGroupsById.has(id)) {
			result.error.push({
				id,
				description: OPERATION_GROUP_NOT_FOUND_ERROR,
			});
			continue;
		}

		try {
			await prisma.operationGroup.delete({
				where: { id },
				select: { id: true },
			});
			result.success.push({
				id,
				description: "Удалено",
			});
		} catch (error) {
			if (isPrismaDeleteConstraintError(error)) {
				result.error.push({
					id,
					description: DELETE_OPERATION_GROUP_IN_USE_ERROR,
				});
				continue;
			}

			if (isPrismaRecordNotFoundError(error)) {
				result.error.push({
					id,
					description: OPERATION_GROUP_NOT_FOUND_ERROR,
				});
				continue;
			}

			throw error;
		}
	}

	return result;
};

export const deleteMaterials = async (
	ids: number[],
	actorId: number,
): Promise<ActionByTableResult> => {
	const uniqueIds = getUniqueIds(ids);
	const permissions = await getGuidePermissions(actorId);

	if (!hasPermission(permissions, "/guide", "removing")) {
		return {
			success: [],
			error: uniqueIds.map((id) => ({
				id,
				description: DELETE_MATERIAL_NO_RIGHTS_ERROR,
			})),
		};
	}

	const existingMaterials = await prisma.material.findMany({
		where: {
			id: {
				in: uniqueIds,
			},
		},
		select: {
			id: true,
		},
	});
	const materialsById = new Map(existingMaterials.map((material) => [material.id, material]));
	const result: ActionByTableResult = {
		success: [],
		error: [],
	};

	for (const id of uniqueIds) {
		if (!materialsById.has(id)) {
			result.error.push({
				id,
				description: MATERIAL_NOT_FOUND_ERROR,
			});
			continue;
		}

		try {
			await prisma.material.delete({
				where: { id },
				select: { id: true },
			});
			result.success.push({
				id,
				description: "Удалено",
			});
		} catch (error) {
			if (isPrismaDeleteConstraintError(error)) {
				result.error.push({
					id,
					description: DELETE_MATERIAL_IN_USE_ERROR,
				});
				continue;
			}

			if (isPrismaRecordNotFoundError(error)) {
				result.error.push({
					id,
					description: MATERIAL_NOT_FOUND_ERROR,
				});
				continue;
			}

			throw error;
		}
	}

	return result;
};
