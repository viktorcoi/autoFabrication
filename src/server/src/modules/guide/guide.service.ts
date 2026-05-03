import type { Prisma } from "../../generated/prisma/client.js";
import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../shared/errors/app-error.js";
import { hasPermission } from "../../shared/http/permissions.js";
import { removeStoredFile } from "../../shared/storage/avatars.js";
import {
	OPERATION_FILES_LIMIT,
	OPERATION_FILES_TOTAL_SIZE_LIMIT,
	getOperationFileAbsolutePath,
	normalizeOperationFileOriginalName,
	saveOperationFiles,
} from "../../shared/storage/operations.js";
import type { RolePermissions } from "../roles/role.types.js";
import {
	updateBlanksTableItemSchema,
	updateMaterialGroupsTableItemSchema,
	updateMaterialsTableItemSchema,
	updateOperationsTableItemSchema,
	updateOperationGroupsTableItemSchema,
	updateTypeProductsTableItemSchema,
} from "./guide.schemas.js";
import type {
	GetBlanksTableQuery,
	GetMaterialGroupsTableQuery,
	GetMaterialsTableQuery,
	GetOperationsTableQuery,
	GetOperationGroupsTableQuery,
	GetTypeProductsTableQuery,
	UpdateBlanksTablePayload,
	UpdateMaterialGroupsTablePayload,
	UpdateMaterialsTablePayload,
	UpdateOperationsTablePayload,
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

const materialListSelect = {
	id: true,
	name: true,
} satisfies Prisma.materialSelect;

const blankSelect = {
	id: true,
	name: true,
	description: true,
	materialId: true,
	createdAt: true,
	updatedAt: true,
	material: {
		select: {
			id: true,
			name: true,
			description: true,
			materialGroupId: true,
			materialGroup: {
				select: {
					id: true,
					name: true,
					description: true,
				},
			},
		},
	},
} satisfies Prisma.blankSelect;

const blankTableSelect = {
	id: true,
	name: true,
	description: true,
	material: {
		select: {
			name: true,
			materialGroup: {
				select: {
					name: true,
				},
			},
		},
	},
} satisfies Prisma.blankSelect;

const operationGroupListSelect = {
	id: true,
	name: true,
} satisfies Prisma.operationGroupSelect;

const operationFileSelect = {
	id: true,
	originalName: true,
	size: true,
} satisfies Prisma.operationFileSelect;

const operationSelect = {
	id: true,
	name: true,
	description: true,
	operationGroupId: true,
	createdAt: true,
	updatedAt: true,
	operationGroup: {
		select: {
			id: true,
			name: true,
			description: true,
		},
	},
	files: {
		select: operationFileSelect,
		orderBy: {
			id: "asc",
		},
	},
} satisfies Prisma.operationSelect;

const operationTableSelect = {
	id: true,
	name: true,
	description: true,
	operationGroup: {
		select: {
			name: true,
		},
	},
	files: {
		select: operationFileSelect,
		orderBy: {
			id: "asc",
		},
	},
} satisfies Prisma.operationSelect;

const operationFilesStorageSelect = {
	id: true,
	originalName: true,
	size: true,
	storagePath: true,
} satisfies Prisma.operationFileSelect;

const operationUpdateSelect = {
	id: true,
	files: {
		select: operationFilesStorageSelect,
		orderBy: {
			id: "asc",
		},
	},
} satisfies Prisma.operationSelect;

const operationArchiveSelect = {
	id: true,
	name: true,
	files: {
		select: operationFilesStorageSelect,
		orderBy: {
			id: "asc",
		},
	},
} satisfies Prisma.operationSelect;

const operationFileDownloadSelect = {
	id: true,
	originalName: true,
	storagePath: true,
} satisfies Prisma.operationFileSelect;

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

const BLANK_TABLE_FIELD_TO_MODEL_FIELD = {
	id: "id",
	name: "name",
	material: "materialId",
	materialGroup: "materialGroup",
	description: "description",
} as const;

const OPERATION_TABLE_FIELD_TO_MODEL_FIELD = {
	id: "id",
	name: "name",
	operationGroup: "operationGroupId",
	description: "description",
	download: "download",
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
const BLANK_OPTIONAL_MODEL_FIELDS = new Set<string>(["description"]);
const BLANK_SYSTEM_MODEL_FIELDS = new Set<string>(["id", "createdAt", "updatedAt"]);
const BLANK_READONLY_TABLE_FIELDS = new Set<string>(["material", "materialGroup"]);
const OPERATION_OPTIONAL_MODEL_FIELDS = new Set<string>(["description"]);
const OPERATION_SYSTEM_MODEL_FIELDS = new Set<string>(["id", "createdAt", "updatedAt"]);
const OPERATION_READONLY_TABLE_FIELDS = new Set<string>(["operationGroup", "download"]);

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

const blankTableMeta = Object.freeze({
	isConst: Object.freeze(
		Object.entries(BLANK_TABLE_FIELD_TO_MODEL_FIELD)
			.filter(([columnId, modelField]) => (
				BLANK_SYSTEM_MODEL_FIELDS.has(modelField) || BLANK_READONLY_TABLE_FIELDS.has(columnId)
			))
			.map(([columnId]) => columnId),
	),
	isRequired: Object.freeze(
		Object.entries(BLANK_TABLE_FIELD_TO_MODEL_FIELD)
			.filter(([columnId, modelField]) => (
				!BLANK_OPTIONAL_MODEL_FIELDS.has(modelField)
				&& !BLANK_SYSTEM_MODEL_FIELDS.has(modelField)
				&& !BLANK_READONLY_TABLE_FIELDS.has(columnId)
			))
			.map(([columnId]) => columnId),
	),
});

const operationTableMeta = Object.freeze({
	isConst: Object.freeze(
		Object.entries(OPERATION_TABLE_FIELD_TO_MODEL_FIELD)
			.filter(([columnId, modelField]) => (
				OPERATION_SYSTEM_MODEL_FIELDS.has(modelField) || OPERATION_READONLY_TABLE_FIELDS.has(columnId)
			))
			.map(([columnId]) => columnId),
	),
	isRequired: Object.freeze(
		Object.entries(OPERATION_TABLE_FIELD_TO_MODEL_FIELD)
			.filter(([columnId, modelField]) => (
				!OPERATION_OPTIONAL_MODEL_FIELDS.has(modelField)
				&& !OPERATION_SYSTEM_MODEL_FIELDS.has(modelField)
				&& !OPERATION_READONLY_TABLE_FIELDS.has(columnId)
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

type CreateBlankData = {
	name: string;
	description?: string | null;
	materialId: number;
};

type UpdateBlankData = Partial<CreateBlankData>;

type CreateOperationData = {
	name: string;
	description?: string | null;
	operationGroupId: number;
};

type UpdateOperationData = Partial<CreateOperationData> & {
	removedFileIds?: number[];
};

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

const BLANK_NOT_FOUND_ERROR = "Заготовка не найдена";
const BLANK_DUPLICATE_ERROR = "Заготовка с таким названием уже существует";
const UPDATE_BLANK_NO_RIGHTS_ERROR = "У вас нет прав для редактирования";
const UPDATE_BLANK_SUCCESS_DESCRIPTION = "Отредактировано";
const DELETE_BLANK_NO_RIGHTS_ERROR = "У вас нет прав для удаления";
const DELETE_BLANK_IN_USE_ERROR = "Эта заготовка используется и не может быть удалена";

const OPERATION_NOT_FOUND_ERROR = "Операция не найдена";
const OPERATION_DUPLICATE_ERROR = "Операция с таким названием уже существует";
const UPDATE_OPERATION_NO_RIGHTS_ERROR = "У вас нет прав для редактирования";
const UPDATE_OPERATION_SUCCESS_DESCRIPTION = "Отредактировано";
const DELETE_OPERATION_NO_RIGHTS_ERROR = "У вас нет прав для удаления";
const DELETE_OPERATION_IN_USE_ERROR = "Эта операция используется и не может быть удалена";
const OPERATION_FILE_NOT_FOUND_ERROR = "Файл операции не найден";

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

const mapOperationFiles = (
	files: Array<{ id: number; originalName: string; size: number }>,
) => files.map((file) => ({
	id: file.id,
	name: normalizeOperationFileOriginalName(file.originalName),
	size: file.size,
}));

const normalizeOperationFileName = (name: string) =>
	normalizeOperationFileOriginalName(name).trim().toLowerCase();

const getOperationFileDuplicateKey = (file: { name: string; size: number }) =>
	`${normalizeOperationFileName(file.name)}::${file.size}`;

const assertUniqueOperationFiles = (
	existingFiles: Array<{ name: string; size: number }>,
	incomingFiles: Array<{ originalname: string; size: number }>,
) => {
	const existingKeys = new Set(existingFiles.map((file) => getOperationFileDuplicateKey(file)));
	const incomingKeys = new Set<string>();

	for (const file of incomingFiles) {
		const normalizedFileName = normalizeOperationFileOriginalName(file.originalname);
		const duplicateKey = getOperationFileDuplicateKey({
			name: normalizedFileName,
			size: file.size,
		});

		if (existingKeys.has(duplicateKey) || incomingKeys.has(duplicateKey)) {
			throw new AppError(400, `Файл "${normalizedFileName}" уже добавлен к операции`);
		}

		incomingKeys.add(duplicateKey);
	}
};

const cleanupStoredFiles = async (absolutePaths: string[]) => {
	await Promise.allSettled(absolutePaths.map((absolutePath) => removeStoredFile(absolutePath)));
};

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

const buildBlanksTableWhere = (search?: string): Prisma.blankWhereInput | undefined => {
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
				material: {
					is: {
						name: {
							contains: search,
							mode: "insensitive",
						},
					},
				},
			},
			{
				material: {
					is: {
						materialGroup: {
							is: {
								name: {
									contains: search,
									mode: "insensitive",
								},
							},
						},
					},
				},
			},
		],
	};
};

const buildOperationsTableWhere = (search?: string): Prisma.operationWhereInput | undefined => {
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
				operationGroup: {
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

const buildBlanksTableOrderBy = (
	sorting: GetBlanksTableQuery["sorting"],
): Prisma.blankOrderByWithRelationInput[] => {
	if (!sorting) {
		return [{ id: "asc" }];
	}

	switch (sorting.id) {
		case "material":
			return [
				{ material: { name: sorting.sort } },
				{ id: "asc" },
			];
		case "materialGroup":
			return [
				{ material: { materialGroup: { name: sorting.sort } } },
				{ id: "asc" },
			];
		default:
			return [
				{ [sorting.id]: sorting.sort } as Prisma.blankOrderByWithRelationInput,
				{ id: "asc" },
			];
	}
};

const buildOperationsTableOrderBy = (
	sorting: GetOperationsTableQuery["sorting"],
): Prisma.operationOrderByWithRelationInput[] => {
	if (!sorting) {
		return [{ id: "asc" }];
	}

	switch (sorting.id) {
		case "operationGroup":
			return [
				{ operationGroup: { name: sorting.sort } },
				{ id: "asc" },
			];
		case "download":
			return [
				{ files: { _count: sorting.sort === "asc" ? "desc" : "asc" } },
				{ id: "asc" },
			];
		default:
			return [
				{ [sorting.id]: sorting.sort } as Prisma.operationOrderByWithRelationInput,
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

const ensureBlankNameIsUnique = async (name: string, excludedId?: number) => {
	const existingBlank = await prisma.blank.findUnique({
		where: { name },
		select: { id: true },
	});

	if (existingBlank && existingBlank.id !== excludedId) {
		throw new AppError(409, BLANK_DUPLICATE_ERROR);
	}
};

const ensureOperationNameIsUnique = async (name: string, excludedId?: number) => {
	const existingOperation = await prisma.operation.findUnique({
		where: { name },
		select: { id: true },
	});

	if (existingOperation && existingOperation.id !== excludedId) {
		throw new AppError(409, OPERATION_DUPLICATE_ERROR);
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

export const listMaterials = async (search?: string) =>
	prisma.material.findMany({
		where: search
			? {
					name: {
						contains: search,
						mode: "insensitive",
					},
				}
			: undefined,
		select: materialListSelect,
		orderBy: {
			id: "asc",
		},
	});

export const listOperationGroups = async (search?: string) =>
	prisma.operationGroup.findMany({
		where: search
			? {
					name: {
						contains: search,
						mode: "insensitive",
					},
				}
			: undefined,
		select: operationGroupListSelect,
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

export const getBlanksTable = async (query: GetBlanksTableQuery) => {
	const where = buildBlanksTableWhere(query.search);
	const orderBy = buildBlanksTableOrderBy(query.sorting);
	const skip = query.page * query.rows;
	const [total, blanks] = await prisma.$transaction([
		prisma.blank.count({ where }),
		prisma.blank.findMany({
			where,
			select: blankTableSelect,
			orderBy,
			skip,
			take: query.rows,
		}),
	]);

	return {
		total,
		data: blanks.map((blank) => ({
			id: blank.id,
			name: blank.name,
			material: blank.material.name,
			materialGroup: blank.material.materialGroup.name,
			...(blank.description ? { description: blank.description } : {}),
			isConst: [...blankTableMeta.isConst],
			isRequired: [...blankTableMeta.isRequired],
		})),
	};
};

export const getOperationsTable = async (query: GetOperationsTableQuery) => {
	const where = buildOperationsTableWhere(query.search);
	const orderBy = buildOperationsTableOrderBy(query.sorting);
	const skip = query.page * query.rows;
	const [total, operations] = await prisma.$transaction([
		prisma.operation.count({ where }),
		prisma.operation.findMany({
			where,
			select: operationTableSelect,
			orderBy,
			skip,
			take: query.rows,
		}),
	]);

	return {
		total,
		data: operations.map((operation) => ({
			id: operation.id,
			name: operation.name,
			operationGroup: operation.operationGroup.name,
			files: mapOperationFiles(operation.files),
			download: operation.files.length ? "download" : "",
			...(operation.description ? { description: operation.description } : {}),
			isConst: [...operationTableMeta.isConst],
			isRequired: [...operationTableMeta.isRequired],
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

export const getBlankById = async (id: number) => {
	const blank = await prisma.blank.findUnique({
		where: { id },
		select: blankSelect,
	});

	if (!blank) {
		throw new AppError(404, BLANK_NOT_FOUND_ERROR);
	}

	return blank;
};

export const getOperationById = async (id: number) => {
	const operation = await prisma.operation.findUnique({
		where: { id },
		select: operationSelect,
	});

	if (!operation) {
		throw new AppError(404, OPERATION_NOT_FOUND_ERROR);
	}

	return {
		...operation,
		files: mapOperationFiles(operation.files),
	};
};

export const getOperationFileDownloadInfo = async (fileId: number) => {
	const operationFile = await prisma.operationFile.findUnique({
		where: { id: fileId },
		select: operationFileDownloadSelect,
	});

	if (!operationFile) {
		throw new AppError(404, OPERATION_FILE_NOT_FOUND_ERROR);
	}

	return {
		...operationFile,
		originalName: normalizeOperationFileOriginalName(operationFile.originalName),
	};
};

export const getOperationFilesArchiveInfo = async (id: number) => {
	const operation = await prisma.operation.findUnique({
		where: { id },
		select: operationArchiveSelect,
	});

	if (!operation) {
		throw new AppError(404, OPERATION_NOT_FOUND_ERROR);
	}

	return {
		...operation,
		files: operation.files.map((file) => ({
			...file,
			originalName: normalizeOperationFileOriginalName(file.originalName),
		})),
	};
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

export const createBlank = async (data: CreateBlankData) => {
	await ensureBlankNameIsUnique(data.name);
	await getMaterialById(data.materialId);

	return prisma.blank.create({
		data: {
			name: data.name,
			description: data.description,
			material: {
				connect: {
					id: data.materialId,
				},
			},
		},
		select: blankSelect,
	});
};

export const createOperation = async (
	data: CreateOperationData,
	files: Express.Multer.File[],
) => {
	await ensureOperationNameIsUnique(data.name);
	await getOperationGroupById(data.operationGroupId);
	assertUniqueOperationFiles([], files);

	const savedFiles = await saveOperationFiles(files);

	try {
		const operation = await prisma.operation.create({
			data: {
				name: data.name,
				description: data.description,
				operationGroup: {
					connect: {
						id: data.operationGroupId,
					},
				},
				...(savedFiles.length
					? {
							files: {
								create: savedFiles.map((file) => ({
									originalName: file.originalName,
									size: file.size,
									mimeType: file.mimeType,
									storagePath: file.storagePath,
								})),
							},
						}
					: {}),
			},
			select: operationSelect,
		});

		return {
			...operation,
			files: mapOperationFiles(operation.files),
		};
	} catch (error) {
		await cleanupStoredFiles(savedFiles.map((file) => file.absolutePath));
		throw error;
	}
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

export const updateBlank = async (id: number, data: UpdateBlankData) => {
	await getBlankById(id);

	if (typeof data.name === "string") {
		await ensureBlankNameIsUnique(data.name, id);
	}

	if (typeof data.materialId === "number") {
		await getMaterialById(data.materialId);
	}

	return prisma.blank.update({
		where: { id },
		data: {
			name: data.name,
			description: data.description,
			...(typeof data.materialId === "number"
				? {
						material: {
							connect: {
								id: data.materialId,
							},
						},
					}
				: {}),
		},
		select: blankSelect,
	});
};

export const updateOperation = async (
	id: number,
	data: UpdateOperationData,
	files: Express.Multer.File[],
) => {
	const currentOperation = await prisma.operation.findUnique({
		where: { id },
		select: operationUpdateSelect,
	});

	if (!currentOperation) {
		throw new AppError(404, OPERATION_NOT_FOUND_ERROR);
	}

	if (typeof data.name === "string") {
		await ensureOperationNameIsUnique(data.name, id);
	}

	if (typeof data.operationGroupId === "number") {
		await getOperationGroupById(data.operationGroupId);
	}

	const removedFileIds = getUniqueIds(data.removedFileIds ?? []);
	const currentFilesById = new Map(currentOperation.files.map((file) => [file.id, file]));
	const removedFiles = removedFileIds
		.map((fileId) => currentFilesById.get(fileId))
		.filter((file): file is (typeof currentOperation.files)[number] => Boolean(file));

	if (removedFiles.length !== removedFileIds.length) {
		throw new AppError(400, OPERATION_FILE_NOT_FOUND_ERROR);
	}

	const remainingFiles = currentOperation.files.filter((file) => !removedFileIds.includes(file.id));
	const totalFilesCount = remainingFiles.length + files.length;
	const totalFilesSize = remainingFiles.reduce((result, file) => result + file.size, 0)
		+ files.reduce((result, file) => result + file.size, 0);
	assertUniqueOperationFiles(
		remainingFiles.map((file) => ({
			name: file.originalName,
			size: file.size,
		})),
		files,
	);

	if (totalFilesCount > OPERATION_FILES_LIMIT) {
		throw new AppError(400, "Можно хранить не более 20 файлов у одной операции");
	}

	if (totalFilesSize > OPERATION_FILES_TOTAL_SIZE_LIMIT) {
		throw new AppError(413, "Общий размер файлов операции не должен превышать 200 MB");
	}

	const savedFiles = await saveOperationFiles(files);

	try {
		const operation = await prisma.operation.update({
			where: { id },
			data: {
				name: data.name,
				description: data.description,
				...(typeof data.operationGroupId === "number"
					? {
							operationGroup: {
								connect: {
									id: data.operationGroupId,
								},
							},
						}
					: {}),
				...(removedFileIds.length || savedFiles.length
					? {
							files: {
								...(removedFileIds.length
									? {
											deleteMany: {
												id: {
													in: removedFileIds,
												},
											},
										}
									: {}),
								...(savedFiles.length
									? {
											create: savedFiles.map((file) => ({
												originalName: file.originalName,
												size: file.size,
												mimeType: file.mimeType,
												storagePath: file.storagePath,
											})),
										}
									: {}),
							},
						}
					: {}),
			},
			select: operationSelect,
		});

		if (removedFiles.length) {
			const removedAbsolutePaths = removedFiles
				.map((file) => getOperationFileAbsolutePath(file.storagePath))
				.filter((absolutePath): absolutePath is string => Boolean(absolutePath));
			await cleanupStoredFiles(removedAbsolutePaths);
		}

		return {
			...operation,
			files: mapOperationFiles(operation.files),
		};
	} catch (error) {
		await cleanupStoredFiles(savedFiles.map((file) => file.absolutePath));
		throw error;
	}
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

export const updateBlanksTable = async (
	payload: UpdateBlanksTablePayload,
	actorId: number,
): Promise<ActionByTableResult> => {
	const permissions = await getGuidePermissions(actorId);
	const ids = Object.keys(payload).map((id) => Number(id));

	if (!hasPermission(permissions, "/guide", "editing")) {
		return {
			success: [],
			error: ids.map((id) => ({
				id,
				description: UPDATE_BLANK_NO_RIGHTS_ERROR,
			})),
		};
	}

	const result: ActionByTableResult = {
		success: [],
		error: [],
	};

	for (const [rawId, rawItem] of Object.entries(payload)) {
		const id = Number(rawId);
		const parsedItem = updateBlanksTableItemSchema.safeParse(rawItem);

		if (!parsedItem.success) {
			result.error.push({
				id,
				description: getValidationErrorMessage(parsedItem.error.issues) || "Некорректные данные",
			});
			continue;
		}

		try {
			await updateBlank(id, parsedItem.data);
			result.success.push({
				id,
				description: UPDATE_BLANK_SUCCESS_DESCRIPTION,
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

export const updateOperationsTable = async (
	payload: UpdateOperationsTablePayload,
	actorId: number,
): Promise<ActionByTableResult> => {
	const permissions = await getGuidePermissions(actorId);
	const ids = Object.keys(payload).map((id) => Number(id));

	if (!hasPermission(permissions, "/guide", "editing")) {
		return {
			success: [],
			error: ids.map((id) => ({
				id,
				description: UPDATE_OPERATION_NO_RIGHTS_ERROR,
			})),
		};
	}

	const result: ActionByTableResult = {
		success: [],
		error: [],
	};

	for (const [rawId, rawItem] of Object.entries(payload)) {
		const id = Number(rawId);
		const parsedItem = updateOperationsTableItemSchema.safeParse(rawItem);

		if (!parsedItem.success) {
			result.error.push({
				id,
				description: getValidationErrorMessage(parsedItem.error.issues) || "Некорректные данные",
			});
			continue;
		}

		try {
			await updateOperation(id, parsedItem.data, []);
			result.success.push({
				id,
				description: UPDATE_OPERATION_SUCCESS_DESCRIPTION,
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

export const deleteBlanks = async (
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
				description: DELETE_BLANK_NO_RIGHTS_ERROR,
			})),
		};
	}

	const existingBlanks = await prisma.blank.findMany({
		where: {
			id: {
				in: uniqueIds,
			},
		},
		select: {
			id: true,
		},
	});
	const blanksById = new Map(existingBlanks.map((blank) => [blank.id, blank]));
	const result: ActionByTableResult = {
		success: [],
		error: [],
	};

	for (const id of uniqueIds) {
		if (!blanksById.has(id)) {
			result.error.push({
				id,
				description: BLANK_NOT_FOUND_ERROR,
			});
			continue;
		}

		try {
			await prisma.blank.delete({
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
					description: DELETE_BLANK_IN_USE_ERROR,
				});
				continue;
			}

			if (isPrismaRecordNotFoundError(error)) {
				result.error.push({
					id,
					description: BLANK_NOT_FOUND_ERROR,
				});
				continue;
			}

			throw error;
		}
	}

	return result;
};

export const deleteOperations = async (
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
				description: DELETE_OPERATION_NO_RIGHTS_ERROR,
			})),
		};
	}

	const existingOperations = await prisma.operation.findMany({
		where: {
			id: {
				in: uniqueIds,
			},
		},
		select: {
			id: true,
		},
	});
	const operationsById = new Map(existingOperations.map((operation) => [operation.id, operation]));
	const result: ActionByTableResult = {
		success: [],
		error: [],
	};

	for (const id of uniqueIds) {
		if (!operationsById.has(id)) {
			result.error.push({
				id,
				description: OPERATION_NOT_FOUND_ERROR,
			});
			continue;
		}

		try {
			const deletedOperation = await prisma.operation.delete({
				where: { id },
				select: {
					id: true,
					files: {
						select: {
							storagePath: true,
						},
					},
				},
			});
			const deletedAbsolutePaths = deletedOperation.files
				.map((file) => getOperationFileAbsolutePath(file.storagePath))
				.filter((absolutePath): absolutePath is string => Boolean(absolutePath));
			await cleanupStoredFiles(deletedAbsolutePaths);
			result.success.push({
				id,
				description: "Удалено",
			});
		} catch (error) {
			if (isPrismaDeleteConstraintError(error)) {
				result.error.push({
					id,
					description: DELETE_OPERATION_IN_USE_ERROR,
				});
				continue;
			}

			if (isPrismaRecordNotFoundError(error)) {
				result.error.push({
					id,
					description: OPERATION_NOT_FOUND_ERROR,
				});
				continue;
			}

			throw error;
		}
	}

	return result;
};
