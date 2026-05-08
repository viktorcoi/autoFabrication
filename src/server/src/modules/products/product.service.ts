import type { Prisma } from "../../generated/prisma/client.js";
import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../shared/errors/app-error.js";
import { hasPermission } from "../../shared/http/permissions.js";
import { removeStoredFile } from "../../shared/storage/avatars.js";
import {
	PRODUCT_FILES_LIMIT,
	PRODUCT_FILES_TOTAL_SIZE_LIMIT,
	PRODUCT_IMAGES_LIMIT,
	PRODUCT_IMAGES_TOTAL_SIZE_LIMIT,
	getProductFileAbsolutePath,
	getProductImageAbsolutePath,
	getProductImagePublicPath,
	normalizeProductFileOriginalName,
	saveProductFiles,
	saveProductImages,
} from "../../shared/storage/products.js";
import type { RolePermissions } from "../roles/role.types.js";
import { updateProductsTableItemSchema } from "./product.schemas.js";
import type {
	CreateProductPayload,
	GetProductsQuery,
	GetProductsTableQuery,
	UpdateProductPayload,
	UpdateProductsTablePayload,
} from "./product.schemas.js";

const productStoredFileSelect = {
	id: true,
	originalName: true,
	size: true,
	mimeType: true,
	storagePath: true,
} satisfies Prisma.productFileSelect;

const productStoredImageSelect = {
	id: true,
	originalName: true,
	size: true,
	mimeType: true,
	storagePath: true,
	sortOrder: true,
} satisfies Prisma.productImageSelect;

const productSelect = {
	id: true,
	name: true,
	description: true,
	typeProductId: true,
	materialId: true,
	creatorId: true,
	createdAt: true,
	updatedAt: true,
	typeProduct: {
		select: {
			id: true,
			name: true,
			description: true,
		},
	},
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
	creator: {
		select: {
			id: true,
			firstName: true,
			lastName: true,
			middleName: true,
			login: true,
		},
	},
	files: {
		select: productStoredFileSelect,
		orderBy: {
			id: "asc",
		},
	},
	images: {
		select: productStoredImageSelect,
		orderBy: [
			{ sortOrder: "asc" },
			{ id: "asc" },
		],
	},
	components: {
		select: {
			id: true,
			componentProductId: true,
			count: true,
			componentProduct: {
				select: {
					id: true,
					name: true,
					typeProduct: {
						select: {
							id: true,
							name: true,
							description: true,
						},
					},
					material: {
						select: {
							id: true,
							name: true,
							description: true,
						},
					},
				},
			},
		},
		orderBy: {
			id: "asc",
		},
	},
} satisfies Prisma.productSelect;

const productTableSelect = {
	id: true,
	name: true,
	description: true,
	createdAt: true,
	typeProduct: {
		select: {
			name: true,
		},
	},
	material: {
		select: {
			name: true,
		},
	},
	creator: {
		select: {
			firstName: true,
			lastName: true,
			middleName: true,
		},
	},
	files: {
		select: {
			id: true,
			originalName: true,
			size: true,
		},
		orderBy: {
			id: "asc",
		},
	},
	_count: {
		select: {
			components: true,
		},
	},
} satisfies Prisma.productSelect;

const productUpdateSelect = {
	id: true,
	name: true,
	typeProductId: true,
	materialId: true,
	files: {
		select: productStoredFileSelect,
	},
	images: {
		select: productStoredImageSelect,
		orderBy: [
			{ sortOrder: "asc" },
			{ id: "asc" },
		],
	},
} satisfies Prisma.productSelect;

const productFileDownloadSelect = {
	id: true,
	originalName: true,
	storagePath: true,
} satisfies Prisma.productFileSelect;

const productArchiveSelect = {
	id: true,
	name: true,
	files: {
		select: productFileDownloadSelect,
		orderBy: {
			id: "asc",
		},
	},
} satisfies Prisma.productSelect;

const productListSelect = {
	id: true,
	name: true,
} satisfies Prisma.productSelect;

const PRODUCT_TABLE_FIELD_TO_MODEL_FIELD = {
	id: "id",
	name: "name",
	typeProduct: "typeProductId",
	material: "materialId",
	creator: "creatorId",
	createdAt: "createdAt",
	filesDownload: "filesDownload",
	relatedProductsCount: "relatedProductsCount",
	description: "description",
} as const;

const PRODUCT_OPTIONAL_MODEL_FIELDS = new Set<string>(["description"]);
const PRODUCT_SYSTEM_MODEL_FIELDS = new Set<string>(["id", "createdAt", "updatedAt", "creatorId"]);
const PRODUCT_READONLY_TABLE_FIELDS = new Set<string>([
	"typeProduct",
	"material",
	"creator",
	"createdAt",
	"filesDownload",
	"relatedProductsCount",
]);

const productTableMeta = Object.freeze({
	isConst: Object.freeze(
		Object.entries(PRODUCT_TABLE_FIELD_TO_MODEL_FIELD)
			.filter(([columnId, modelField]) => (
				PRODUCT_SYSTEM_MODEL_FIELDS.has(modelField) || PRODUCT_READONLY_TABLE_FIELDS.has(columnId)
			))
			.map(([columnId]) => columnId),
	),
	isRequired: Object.freeze(
		Object.entries(PRODUCT_TABLE_FIELD_TO_MODEL_FIELD)
			.filter(([columnId, modelField]) => (
				!PRODUCT_OPTIONAL_MODEL_FIELDS.has(modelField)
				&& !PRODUCT_SYSTEM_MODEL_FIELDS.has(modelField)
				&& !PRODUCT_READONLY_TABLE_FIELDS.has(columnId)
			))
			.map(([columnId]) => columnId),
	),
});

type ProductComponentPayload = {
	productId: number;
	count: number;
};

type ActionByTableResultItem = {
	id: number;
	description: string;
};

export type ActionByTableResult = {
	success: ActionByTableResultItem[];
	error: ActionByTableResultItem[];
};

const PRODUCT_NOT_FOUND_ERROR = "Изделие не найдено";
const PRODUCT_DUPLICATE_ERROR = "Изделие с таким названием, типом и материалом уже существует";
const PRODUCT_FILE_NOT_FOUND_ERROR = "Файл изделия не найден";
const PRODUCT_IMAGE_NOT_FOUND_ERROR = "Изображение изделия не найдено";
const PRODUCT_COMPONENT_NOT_FOUND_ERROR = "Связанное изделие не найдено";
const PRODUCT_COMPONENT_SELF_ERROR = "Изделие не может быть связано само с собой";
const PRODUCT_COMPONENT_DUPLICATE_ERROR = "Одно изделие нельзя связать несколько раз";
const PRODUCT_COMPONENT_CYCLE_ERROR = "Связь создаст циклическую зависимость между изделиями";
const UPDATE_PRODUCT_NO_RIGHTS_ERROR = "У вас нет прав для редактирования";
const UPDATE_PRODUCT_SUCCESS_DESCRIPTION = "Отредактировано";
const DELETE_PRODUCT_NO_RIGHTS_ERROR = "У вас нет прав для удаления";
const DELETE_PRODUCT_IN_USE_ERROR = "Это изделие используется и не может быть удалено";

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

const getProductPermissions = async (actorId: number) => {
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

const formatUserFullName = (user: { firstName: string; lastName: string; middleName: string | null }) =>
	[user.firstName, user.lastName, user.middleName].filter(Boolean).join(" ");

const mapProductFiles = (files: Array<{ id: number; originalName: string; size: number }>) =>
	files.map((file) => ({
		id: file.id,
		name: normalizeProductFileOriginalName(file.originalName),
		size: file.size,
	}));

const mapProductImages = (images: Array<{
	id: number;
	originalName: string;
	size: number;
	storagePath: string;
	sortOrder: number;
}>) =>
	images.map((image) => ({
		id: image.id,
		name: normalizeProductFileOriginalName(image.originalName),
		size: image.size,
		sortOrder: image.sortOrder,
		url: getProductImagePublicPath(image.storagePath),
	}));

const mapProduct = <TProduct extends {
	files: Array<{ id: number; originalName: string; size: number }>;
	images: Array<{ id: number; originalName: string; size: number; storagePath: string; sortOrder: number }>;
	creator: { firstName: string; lastName: string; middleName: string | null; login: string };
	components: Array<{
		id: number;
		componentProductId: number;
		count: number;
		componentProduct: {
			id: number;
			name: string;
			typeProduct: { id: number; name: string; description: string | null };
			material: { id: number; name: string; description: string | null } | null;
		};
	}>;
}>(product: TProduct) => {
	const { components, ...productData } = product;

	return {
		...productData,
		creator: {
			...product.creator,
			fullName: formatUserFullName(product.creator),
		},
		files: mapProductFiles(product.files),
		images: mapProductImages(product.images),
		relatedProducts: components.map((component) => ({
			id: component.id,
			productId: component.componentProductId,
			count: component.count,
			product: component.componentProduct,
		})),
	};
};

const getProductFileDuplicateKey = (file: { name: string; size: number }) =>
	`${normalizeProductFileOriginalName(file.name).toLocaleLowerCase()}::${file.size}`;

const assertUniqueProductStoredFiles = (
	existingFiles: Array<{ name: string; size: number }>,
	incomingFiles: Express.Multer.File[],
	entityName: "файл" | "изображение",
) => {
	const existingKeys = new Set(existingFiles.map((file) => getProductFileDuplicateKey(file)));
	const incomingKeys = new Set<string>();

	for (const file of incomingFiles) {
		const normalizedFileName = normalizeProductFileOriginalName(file.originalname);
		const key = getProductFileDuplicateKey({
			name: normalizedFileName,
			size: file.size,
		});

		if (existingKeys.has(key) || incomingKeys.has(key)) {
			throw new AppError(409, `${entityName === "файл" ? "Файл" : "Изображение"} "${normalizedFileName}" уже добавлен`);
		}

		incomingKeys.add(key);
	}
};

const cleanupStoredFiles = async (absolutePaths: string[]) => {
	const results = await Promise.allSettled(absolutePaths.map((absolutePath) => removeStoredFile(absolutePath)));
	const rejectedResult = results.find((result): result is PromiseRejectedResult => result.status === "rejected");

	if (rejectedResult) {
		throw rejectedResult.reason;
	}
};

const ensureTypeProductExists = async (id: number) => {
	const typeProduct = await prisma.typeProduct.findUnique({
		where: { id },
		select: { id: true },
	});

	if (!typeProduct) {
		throw new AppError(404, "Тип изделия не найден");
	}
};

const ensureMaterialExists = async (id: number) => {
	const material = await prisma.material.findUnique({
		where: { id },
		select: { id: true },
	});

	if (!material) {
		throw new AppError(404, "Материал не найден");
	}
};

const ensureProductNameIsUnique = async (
	name: string,
	typeProductId: number,
	materialId: number | null | undefined,
	exceptId?: number,
) => {
	const existingProduct = await prisma.product.findFirst({
		where: {
			name,
			typeProductId,
			materialId: materialId ?? null,
			...(exceptId ? { id: { not: exceptId } } : {}),
		},
		select: {
			id: true,
		},
	});

	if (existingProduct) {
		throw new AppError(409, PRODUCT_DUPLICATE_ERROR);
	}
};

const canReachProduct = (
	adjacency: Map<number, number[]>,
	startProductId: number,
	targetProductId: number,
) => {
	const visited = new Set<number>();
	const stack = [startProductId];

	while (stack.length) {
		const productId = stack.pop();

		if (typeof productId !== "number" || visited.has(productId)) {
			continue;
		}

		if (productId === targetProductId) {
			return true;
		}

		visited.add(productId);

		for (const componentProductId of adjacency.get(productId) ?? []) {
			stack.push(componentProductId);
		}
	}

	return false;
};

const getUnavailableRelatedProductReasons = async (
	editProductId: number,
	candidateIds: number[],
) => {
	const unavailableProducts = new Map<number, string>();
	const uniqueCandidateIds = getUniqueIds(candidateIds);

	if (!uniqueCandidateIds.length) {
		return unavailableProducts;
	}

	const product = await prisma.product.findUnique({
		where: { id: editProductId },
		select: { id: true },
	});

	if (!product) {
		throw new AppError(404, PRODUCT_NOT_FOUND_ERROR);
	}

	const components = await prisma.productComponent.findMany({
		where: {
			productId: {
				not: editProductId,
			},
		},
		select: {
			productId: true,
			componentProductId: true,
		},
	});
	const adjacency = components.reduce<Map<number, number[]>>((result, component) => {
		const currentComponents = result.get(component.productId) ?? [];

		currentComponents.push(component.componentProductId);
		result.set(component.productId, currentComponents);

		return result;
	}, new Map());

	for (const candidateId of uniqueCandidateIds) {
		if (candidateId === editProductId) {
			unavailableProducts.set(candidateId, PRODUCT_COMPONENT_SELF_ERROR);
			continue;
		}

		if (canReachProduct(adjacency, candidateId, editProductId)) {
			unavailableProducts.set(candidateId, PRODUCT_COMPONENT_CYCLE_ERROR);
		}
	}

	return unavailableProducts;
};

const normalizeRelatedProducts = async (
	productId: number | null,
	relatedProducts: ProductComponentPayload[] = [],
) => {
	const seenIds = new Set<number>();
	const normalizedProducts: ProductComponentPayload[] = [];

	for (const relatedProduct of relatedProducts) {
		if (productId !== null && relatedProduct.productId === productId) {
			throw new AppError(400, PRODUCT_COMPONENT_SELF_ERROR);
		}

		if (seenIds.has(relatedProduct.productId)) {
			throw new AppError(409, PRODUCT_COMPONENT_DUPLICATE_ERROR);
		}

		seenIds.add(relatedProduct.productId);
		normalizedProducts.push(relatedProduct);
	}

	if (!normalizedProducts.length) {
		return [];
	}

	const existingProducts = await prisma.product.findMany({
		where: {
			id: {
				in: normalizedProducts.map((product) => product.productId),
			},
		},
		select: {
			id: true,
		},
	});
	const existingIds = new Set(existingProducts.map((product) => product.id));

	if (normalizedProducts.some((product) => !existingIds.has(product.productId))) {
		throw new AppError(404, PRODUCT_COMPONENT_NOT_FOUND_ERROR);
	}

	if (productId !== null) {
		const unavailableProducts = await getUnavailableRelatedProductReasons(
			productId,
			normalizedProducts.map((product) => product.productId),
		);
		const unavailableProduct = normalizedProducts.find((product) => unavailableProducts.has(product.productId));

		if (unavailableProduct) {
			throw new AppError(400, unavailableProducts.get(unavailableProduct.productId) ?? PRODUCT_COMPONENT_CYCLE_ERROR);
		}
	}

	return normalizedProducts;
};

const parseProductSearchId = (search?: string) => {
	if (!search || !/^[1-9]\d*$/.test(search)) {
		return null;
	}

	const id = Number(search);

	return Number.isSafeInteger(id) ? id : null;
};

const buildProductsTableWhere = (query: GetProductsTableQuery): Prisma.productWhereInput | undefined => {
	const filters: Prisma.productWhereInput = {};
	const search = query.search;

	if (search) {
		const searchId = parseProductSearchId(search);
		const searchFilters: Prisma.productWhereInput[] = [
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
				typeProduct: {
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
						name: {
							contains: search,
							mode: "insensitive",
						},
					},
				},
			},
			{
				creator: {
					is: {
						OR: [
							{
								firstName: {
									contains: search,
									mode: "insensitive",
								},
							},
							{
								lastName: {
									contains: search,
									mode: "insensitive",
								},
							},
							{
								middleName: {
									contains: search,
									mode: "insensitive",
								},
							},
						],
					},
				},
			},
		];

		if (searchId !== null) {
			searchFilters.unshift({ id: searchId });
		}

		filters.OR = searchFilters;
	}

	if (typeof query.typeProductId === "number") {
		filters.typeProductId = query.typeProductId;
	}

	if (typeof query.materialId === "number") {
		filters.materialId = query.materialId;
	}

	if (typeof query.creatorId === "number") {
		filters.creatorId = query.creatorId;
	}

	if (query.createdAtFrom || query.createdAtTo) {
		filters.createdAt = {
			...(query.createdAtFrom ? { gte: query.createdAtFrom } : {}),
			...(query.createdAtTo ? { lt: query.createdAtTo } : {}),
		};
	}

	return Object.keys(filters).length ? filters : undefined;
};

const buildProductsListWhere = (query: GetProductsQuery): Prisma.productWhereInput | undefined => {
	const filters: Prisma.productWhereInput = {};

	if (query.search) {
		const searchId = parseProductSearchId(query.search);
		const searchFilters: Prisma.productWhereInput[] = [
			{
				name: {
					contains: query.search,
					mode: "insensitive",
				},
			},
			{
				description: {
					contains: query.search,
					mode: "insensitive",
				},
			},
			{
				typeProduct: {
					is: {
						name: {
							contains: query.search,
							mode: "insensitive",
						},
					},
				},
			},
			{
				material: {
					is: {
						name: {
							contains: query.search,
							mode: "insensitive",
						},
					},
				},
			},
		];

		if (searchId !== null) {
			searchFilters.unshift({ id: searchId });
		}

		filters.OR = searchFilters;
	}

	if (typeof query.typeProductId === "number") {
		filters.typeProductId = query.typeProductId;
	}

	if (typeof query.materialId === "number") {
		filters.materialId = query.materialId;
	}

	return Object.keys(filters).length ? filters : undefined;
};

const buildProductsTableOrderBy = (
	sorting: GetProductsTableQuery["sorting"],
): Prisma.productOrderByWithRelationInput[] => {
	if (!sorting) {
		return [{ id: "asc" }];
	}

	switch (sorting.id) {
		case "id":
			return [{ id: sorting.sort }];
		case "typeProduct":
			return [
				{ typeProduct: { name: sorting.sort } },
				{ id: "asc" },
			];
		case "material":
			return [
				{ material: { name: sorting.sort } },
				{ id: "asc" },
			];
		case "creator":
			return [
				{ creator: { lastName: sorting.sort } },
				{ creator: { firstName: sorting.sort } },
				{ creator: { middleName: sorting.sort } },
				{ id: "asc" },
			];
		case "filesDownload":
			return [
				{ files: { _count: sorting.sort === "asc" ? "desc" : "asc" } },
				{ id: "asc" },
			];
		case "relatedProductsCount":
			return [
				{ components: { _count: sorting.sort } },
				{ id: "asc" },
			];
		default:
			return [
				{ [sorting.id]: sorting.sort } as Prisma.productOrderByWithRelationInput,
				{ id: "asc" },
			];
	}
};

const buildProductsListOrderBy = (
	sorting: GetProductsQuery["sorting"],
): Prisma.productOrderByWithRelationInput[] => {
	if (!sorting) {
		return [
			{ name: "asc" },
			{ id: "asc" },
		];
	}

	switch (sorting.id) {
		case "typeProduct":
			return [
				{ typeProduct: { name: sorting.sort } },
				{ id: "asc" },
			];
		case "material":
			return [
				{ material: { name: sorting.sort } },
				{ id: "asc" },
			];
		case "creator":
			return [
				{ creator: { firstName: sorting.sort } },
				{ creator: { lastName: sorting.sort } },
				{ creator: { middleName: sorting.sort } },
				{ id: "asc" },
			];
		default:
			return [
				{ [sorting.id]: sorting.sort } as Prisma.productOrderByWithRelationInput,
				{ id: "asc" },
			];
	}
};

export const listProducts = async (query: GetProductsQuery) => {
	const products = await prisma.product.findMany({
		where: buildProductsListWhere(query),
		select: productListSelect,
		orderBy: buildProductsListOrderBy(query.sorting),
	});

	if (typeof query.editProductId !== "number") {
		return products;
	}

	const unavailableProducts = await getUnavailableRelatedProductReasons(
		query.editProductId,
		products.map((product) => product.id),
	);

	return products.map((product) => {
		const disabledReason = unavailableProducts.get(product.id);

		return {
			...product,
			disabled: Boolean(disabledReason),
			...(disabledReason ? { disabledReason } : {}),
		};
	});
};

export const getProductsTable = async (query: GetProductsTableQuery) => {
	const where = buildProductsTableWhere(query);
	const orderBy = buildProductsTableOrderBy(query.sorting);
	const skip = query.page * query.rows;
	const [total, products] = await prisma.$transaction([
		prisma.product.count({ where }),
		prisma.product.findMany({
			where,
			select: productTableSelect,
			orderBy,
			skip,
			take: query.rows,
		}),
	]);

	return {
		total,
		data: products.map((product) => {
			const files = mapProductFiles(product.files);
			const relatedProductsCount = product._count.components;

			return {
				id: product.id,
				name: product.name,
				description: product.description ?? "",
				typeProduct: product.typeProduct.name,
				material: product.material?.name ?? "",
				creator: formatUserFullName(product.creator),
				createdAt: product.createdAt,
				files,
				filesDownload: files.length ? "download" : "",
				relatedProductsCount: relatedProductsCount || "",
				isConst: [...productTableMeta.isConst],
				isRequired: [...productTableMeta.isRequired],
			};
		}),
	};
};

export const getProductById = async (id: number) => {
	const product = await prisma.product.findUnique({
		where: { id },
		select: productSelect,
	});

	if (!product) {
		throw new AppError(404, PRODUCT_NOT_FOUND_ERROR);
	}

	return mapProduct(product);
};

export const getProductFileDownloadInfo = async (fileId: number) => {
	const productFile = await prisma.productFile.findUnique({
		where: { id: fileId },
		select: productFileDownloadSelect,
	});

	if (!productFile) {
		throw new AppError(404, PRODUCT_FILE_NOT_FOUND_ERROR);
	}

	return {
		...productFile,
		originalName: normalizeProductFileOriginalName(productFile.originalName),
	};
};

export const getProductFilesArchiveInfo = async (productId: number) => {
	const product = await prisma.product.findUnique({
		where: { id: productId },
		select: productArchiveSelect,
	});

	if (!product) {
		throw new AppError(404, PRODUCT_NOT_FOUND_ERROR);
	}

	return {
		...product,
		files: product.files.map((file) => ({
			...file,
			originalName: normalizeProductFileOriginalName(file.originalName),
		})),
	};
};

export const createProduct = async (
	data: CreateProductPayload,
	files: Express.Multer.File[],
	images: Express.Multer.File[],
	actorId: number,
) => {
	await ensureTypeProductExists(data.typeProductId);
	if (data.materialId !== undefined && data.materialId !== null) {
		await ensureMaterialExists(data.materialId);
	}
	await ensureProductNameIsUnique(data.name, data.typeProductId, data.materialId);
	const relatedProducts = await normalizeRelatedProducts(null, data.relatedProducts);
	assertUniqueProductStoredFiles([], files, "файл");
	assertUniqueProductStoredFiles([], images, "изображение");

	const savedFiles = await saveProductFiles(files);
	const savedImages = await saveProductImages(images);

	try {
		const product = await prisma.product.create({
			data: {
				name: data.name,
				description: data.description,
				typeProduct: {
					connect: {
						id: data.typeProductId,
					},
				},
				...(typeof data.materialId === "number"
					? {
							material: {
								connect: {
									id: data.materialId,
								},
							},
						}
					: {}),
				creator: {
					connect: {
						id: actorId,
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
				...(savedImages.length
					? {
							images: {
								create: savedImages.map((image, index) => ({
									originalName: image.originalName,
									size: image.size,
									mimeType: image.mimeType,
									storagePath: image.storagePath,
									sortOrder: index,
								})),
							},
						}
					: {}),
				...(relatedProducts.length
					? {
							components: {
								create: relatedProducts.map((relatedProduct) => ({
									count: relatedProduct.count,
									componentProduct: {
										connect: {
											id: relatedProduct.productId,
										},
									},
								})),
							},
						}
					: {}),
			},
			select: productSelect,
		});

		return mapProduct(product);
	} catch (error) {
		await cleanupStoredFiles([
			...savedFiles.map((file) => file.absolutePath),
			...savedImages.map((image) => image.absolutePath),
		]);
		throw error;
	}
};

export const updateProduct = async (
	id: number,
	data: UpdateProductPayload,
	files: Express.Multer.File[],
	images: Express.Multer.File[],
) => {
	const currentProduct = await prisma.product.findUnique({
		where: { id },
		select: productUpdateSelect,
	});

	if (!currentProduct) {
		throw new AppError(404, PRODUCT_NOT_FOUND_ERROR);
	}

	if (typeof data.typeProductId === "number") {
		await ensureTypeProductExists(data.typeProductId);
	}

	if (typeof data.materialId === "number") {
		await ensureMaterialExists(data.materialId);
	}

	const nextName = data.name ?? currentProduct.name;
	const nextTypeProductId = data.typeProductId ?? currentProduct.typeProductId;
	const nextMaterialId = data.materialId !== undefined ? data.materialId : currentProduct.materialId;
	if (
		nextName !== currentProduct.name
		|| nextTypeProductId !== currentProduct.typeProductId
		|| nextMaterialId !== currentProduct.materialId
	) {
		await ensureProductNameIsUnique(nextName, nextTypeProductId, nextMaterialId, id);
	}

	const relatedProducts = data.relatedProducts === undefined
		? undefined
		: await normalizeRelatedProducts(id, data.relatedProducts);
	const removedFileIds = getUniqueIds(data.removedFileIds ?? []);
	const removedImageIds = getUniqueIds(data.removedImageIds ?? []);
	const currentFilesById = new Map(currentProduct.files.map((file) => [file.id, file]));
	const currentImagesById = new Map(currentProduct.images.map((image) => [image.id, image]));
	const removedFiles = removedFileIds
		.map((fileId) => currentFilesById.get(fileId))
		.filter((file): file is (typeof currentProduct.files)[number] => Boolean(file));
	const removedImages = removedImageIds
		.map((imageId) => currentImagesById.get(imageId))
		.filter((image): image is (typeof currentProduct.images)[number] => Boolean(image));

	if (removedFiles.length !== removedFileIds.length) {
		throw new AppError(400, PRODUCT_FILE_NOT_FOUND_ERROR);
	}

	if (removedImages.length !== removedImageIds.length) {
		throw new AppError(400, PRODUCT_IMAGE_NOT_FOUND_ERROR);
	}

	const remainingFiles = currentProduct.files.filter((file) => !removedFileIds.includes(file.id));
	const remainingImages = currentProduct.images.filter((image) => !removedImageIds.includes(image.id));
	const hasImageOrderIds = data.imageOrderIds !== undefined;
	const imageOrderIds = hasImageOrderIds ? getUniqueIds(data.imageOrderIds ?? []) : undefined;

	if (
		hasImageOrderIds
		&& (
			(imageOrderIds?.length ?? 0) !== (data.imageOrderIds?.length ?? 0)
			|| (imageOrderIds?.length ?? 0) !== remainingImages.length
			|| imageOrderIds?.some((imageId) => !remainingImages.some((image) => image.id === imageId))
		)
	) {
		throw new AppError(400, "Некорректный порядок изображений изделия");
	}

	const orderedRemainingImages = imageOrderIds
		? imageOrderIds
				.map((imageId) => currentImagesById.get(imageId))
				.filter((image): image is (typeof currentProduct.images)[number] => Boolean(image))
		: remainingImages;
	const totalFilesCount = remainingFiles.length + files.length;
	const totalFilesSize = remainingFiles.reduce((result, file) => result + file.size, 0)
		+ files.reduce((result, file) => result + file.size, 0);
	const totalImagesCount = remainingImages.length + images.length;
	const totalImagesSize = remainingImages.reduce((result, image) => result + image.size, 0)
		+ images.reduce((result, image) => result + image.size, 0);

	assertUniqueProductStoredFiles(
		remainingFiles.map((file) => ({
			name: file.originalName,
			size: file.size,
		})),
		files,
		"файл",
	);
	assertUniqueProductStoredFiles(
		remainingImages.map((image) => ({
			name: image.originalName,
			size: image.size,
		})),
		images,
		"изображение",
	);

	if (totalFilesCount > PRODUCT_FILES_LIMIT) {
		throw new AppError(400, "Можно хранить не более 20 файлов у одного изделия");
	}

	if (totalFilesSize > PRODUCT_FILES_TOTAL_SIZE_LIMIT) {
		throw new AppError(413, "Общий размер файлов изделия не должен превышать 200 MB");
	}

	if (totalImagesCount > PRODUCT_IMAGES_LIMIT) {
		throw new AppError(400, "Можно хранить не более 10 изображений у одного изделия");
	}

	if (totalImagesSize > PRODUCT_IMAGES_TOTAL_SIZE_LIMIT) {
		throw new AppError(413, "Общий размер изображений изделия не должен превышать 50 MB");
	}

	const savedFiles = await saveProductFiles(files);
	const savedImages = await saveProductImages(images);
	const shouldUpdateImages = removedImageIds.length || savedImages.length || hasImageOrderIds;

	try {
		const product = await prisma.product.update({
			where: { id },
			data: {
				name: data.name,
				description: data.description,
				...(typeof data.typeProductId === "number"
					? {
							typeProduct: {
								connect: {
									id: data.typeProductId,
								},
							},
						}
					: {}),
				...(data.materialId !== undefined
					? {
							material: {
								...(typeof data.materialId === "number"
									? {
											connect: {
												id: data.materialId,
											},
										}
									: { disconnect: true }),
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
				...(shouldUpdateImages
					? {
							images: {
								...(removedImageIds.length
									? {
											deleteMany: {
												id: {
													in: removedImageIds,
												},
											},
										}
									: {}),
								...(orderedRemainingImages.length
									? {
											update: orderedRemainingImages.map((image, index) => ({
												where: {
													id: image.id,
												},
												data: {
													sortOrder: index,
												},
											})),
										}
									: {}),
								...(savedImages.length
									? {
											create: savedImages.map((image, index) => ({
												originalName: image.originalName,
												size: image.size,
												mimeType: image.mimeType,
												storagePath: image.storagePath,
												sortOrder: orderedRemainingImages.length + index,
											})),
										}
									: {}),
							},
						}
					: {}),
				...(relatedProducts
					? {
							components: {
								deleteMany: {},
								...(relatedProducts.length
									? {
											create: relatedProducts.map((relatedProduct) => ({
												count: relatedProduct.count,
												componentProduct: {
													connect: {
														id: relatedProduct.productId,
													},
												},
											})),
										}
									: {}),
							},
						}
					: {}),
			},
			select: productSelect,
		});

		if (removedFiles.length || removedImages.length) {
			const removedAbsolutePaths = [
				...removedFiles
					.map((file) => getProductFileAbsolutePath(file.storagePath))
					.filter((absolutePath): absolutePath is string => Boolean(absolutePath)),
				...removedImages
					.map((image) => getProductImageAbsolutePath(image.storagePath))
					.filter((absolutePath): absolutePath is string => Boolean(absolutePath)),
			];
			await cleanupStoredFiles(removedAbsolutePaths);
		}

		return mapProduct(product);
	} catch (error) {
		await cleanupStoredFiles([
			...savedFiles.map((file) => file.absolutePath),
			...savedImages.map((image) => image.absolutePath),
		]);
		throw error;
	}
};

export const updateProductsTable = async (
	payload: UpdateProductsTablePayload,
	actorId: number,
): Promise<ActionByTableResult> => {
	const permissions = await getProductPermissions(actorId);
	const ids = Object.keys(payload).map((id) => Number(id));

	if (!hasPermission(permissions, "/products", "editing")) {
		return {
			success: [],
			error: ids.map((id) => ({
				id,
				description: UPDATE_PRODUCT_NO_RIGHTS_ERROR,
			})),
		};
	}

	const result: ActionByTableResult = {
		success: [],
		error: [],
	};

	for (const [rawId, rawItem] of Object.entries(payload)) {
		const id = Number(rawId);
		const parsedItem = updateProductsTableItemSchema.safeParse(rawItem);

		if (!parsedItem.success) {
			result.error.push({
				id,
				description: getValidationErrorMessage(parsedItem.error.issues) || "Некорректные данные",
			});
			continue;
		}

		try {
			await updateProduct(id, parsedItem.data, [], []);
			result.success.push({
				id,
				description: UPDATE_PRODUCT_SUCCESS_DESCRIPTION,
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

export const deleteProducts = async (
	ids: number[],
	actorId: number,
): Promise<ActionByTableResult> => {
	const uniqueIds = getUniqueIds(ids);
	const permissions = await getProductPermissions(actorId);

	if (!hasPermission(permissions, "/products", "removing")) {
		return {
			success: [],
			error: uniqueIds.map((id) => ({
				id,
				description: DELETE_PRODUCT_NO_RIGHTS_ERROR,
			})),
		};
	}

	const existingProducts = await prisma.product.findMany({
		where: {
			id: {
				in: uniqueIds,
			},
		},
		select: {
			id: true,
		},
	});
	const productsById = new Map(existingProducts.map((product) => [product.id, product]));
	const result: ActionByTableResult = {
		success: [],
		error: [],
	};

	for (const id of uniqueIds) {
		if (!productsById.has(id)) {
			result.error.push({
				id,
				description: PRODUCT_NOT_FOUND_ERROR,
			});
			continue;
		}

		try {
			const deletedProduct = await prisma.product.delete({
				where: { id },
				select: {
					id: true,
					files: {
						select: {
							storagePath: true,
						},
					},
					images: {
						select: {
							storagePath: true,
						},
					},
				},
			});
			const deletedAbsolutePaths = [
				...deletedProduct.files
					.map((file) => getProductFileAbsolutePath(file.storagePath))
					.filter((absolutePath): absolutePath is string => Boolean(absolutePath)),
				...deletedProduct.images
					.map((image) => getProductImageAbsolutePath(image.storagePath))
					.filter((absolutePath): absolutePath is string => Boolean(absolutePath)),
			];
			await cleanupStoredFiles(deletedAbsolutePaths);
			result.success.push({
				id,
				description: "Удалено",
			});
		} catch (error) {
			if (isPrismaDeleteConstraintError(error)) {
				result.error.push({
					id,
					description: DELETE_PRODUCT_IN_USE_ERROR,
				});
				continue;
			}

			if (isPrismaRecordNotFoundError(error)) {
				result.error.push({
					id,
					description: PRODUCT_NOT_FOUND_ERROR,
				});
				continue;
			}

			throw error;
		}
	}

	return result;
};
