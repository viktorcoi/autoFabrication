import type { Prisma } from "../../generated/prisma/client.js";
import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../shared/errors/app-error.js";
import { hasPermission } from "../../shared/http/permissions.js";
import { removeStoredFile } from "../../shared/storage/avatars.js";
import {
	PROCESS_FILES_LIMIT,
	PROCESS_FILES_TOTAL_SIZE_LIMIT,
	getProcessFileAbsolutePath,
	normalizeProcessFileOriginalName,
	saveProcessFiles,
} from "../../shared/storage/processes.js";
import type { RolePermissions } from "../roles/role.types.js";
import { updateProcessesTableItemSchema } from "./process.schemas.js";
import type {
	CreateProcessPayload,
	GetProcessesTableQuery,
	UpdateProcessAccessPayload,
	UpdateProcessPayload,
	UpdateProcessesTablePayload,
} from "./process.schemas.js";

const processStoredFileSelect = {
	id: true,
	originalName: true,
	size: true,
	mimeType: true,
	storagePath: true,
} satisfies Prisma.technologicalProcessFileSelect;

const processSelect = {
	id: true,
	productId: true,
	name: true,
	description: true,
	blankId: true,
	creatorId: true,
	disabledById: true,
	disabledAt: true,
	createdAt: true,
	updatedAt: true,
	product: {
		select: {
			id: true,
			name: true,
			materialId: true,
			material: {
				select: {
					id: true,
					name: true,
				},
			},
		},
	},
	blank: {
		select: {
			id: true,
			name: true,
			description: true,
			materialId: true,
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
	disabledBy: {
		select: {
			id: true,
			firstName: true,
			lastName: true,
			middleName: true,
			login: true,
		},
	},
	files: {
		select: processStoredFileSelect,
		orderBy: {
			id: "asc",
		},
	},
} satisfies Prisma.technologicalProcessSelect;

const processTableSelect = {
	id: true,
	name: true,
	description: true,
	creatorId: true,
	disabledById: true,
	disabledAt: true,
	createdAt: true,
	updatedAt: true,
	blank: {
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
	disabledBy: {
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
			operations: true,
		},
	},
} satisfies Prisma.technologicalProcessSelect;

const processUpdateSelect = {
	id: true,
	productId: true,
	name: true,
	blankId: true,
	creatorId: true,
	disabledById: true,
	product: {
		select: {
			materialId: true,
		},
	},
	files: {
		select: processStoredFileSelect,
		orderBy: {
			id: "asc",
		},
	},
} satisfies Prisma.technologicalProcessSelect;

const processFileDownloadSelect = {
	id: true,
	originalName: true,
	storagePath: true,
} satisfies Prisma.technologicalProcessFileSelect;

const processArchiveSelect = {
	id: true,
	name: true,
	files: {
		select: processFileDownloadSelect,
		orderBy: {
			id: "asc",
		},
	},
} satisfies Prisma.technologicalProcessSelect;

const PROCESS_TABLE_FIELD_TO_MODEL_FIELD = {
	id: "id",
	name: "name",
	creator: "creatorId",
	updatedAt: "updatedAt",
	blank: "blankId",
	filesDownload: "filesDownload",
	operationCount: "operationCount",
	access: "disabledById",
	description: "description",
} as const;

const PROCESS_OPTIONAL_MODEL_FIELDS = new Set<string>(["description"]);
const PROCESS_SYSTEM_MODEL_FIELDS = new Set<string>(["id", "createdAt", "updatedAt", "creatorId"]);
const PROCESS_READONLY_TABLE_FIELDS = new Set<string>([
	"creator",
	"blank",
	"filesDownload",
	"operationCount",
	"access",
]);

const processTableMeta = Object.freeze({
	isConst: Object.freeze(
		Object.entries(PROCESS_TABLE_FIELD_TO_MODEL_FIELD)
			.filter(([columnId, modelField]) => (
				PROCESS_SYSTEM_MODEL_FIELDS.has(modelField) || PROCESS_READONLY_TABLE_FIELDS.has(columnId)
			))
			.map(([columnId]) => columnId),
	),
	isRequired: Object.freeze(
		Object.entries(PROCESS_TABLE_FIELD_TO_MODEL_FIELD)
			.filter(([columnId, modelField]) => (
				!PROCESS_OPTIONAL_MODEL_FIELDS.has(modelField)
				&& !PROCESS_SYSTEM_MODEL_FIELDS.has(modelField)
				&& !PROCESS_READONLY_TABLE_FIELDS.has(columnId)
			))
			.map(([columnId]) => columnId),
	),
});

type ActionByTableResultItem = {
	id: number;
	description: string;
};

export type ActionByTableResult = {
	success: ActionByTableResultItem[];
	error: ActionByTableResultItem[];
};

const PROCESS_NOT_FOUND_ERROR = "Техпроцесс не найден";
const PROCESS_FILE_NOT_FOUND_ERROR = "Файл техпроцесса не найден";
const PRODUCT_NOT_FOUND_ERROR = "Изделие не найдено";
const BLANK_NOT_FOUND_ERROR = "Заготовка не найдена";
const BLANK_MATERIAL_MISMATCH_ERROR = "Заготовка должна относиться к материалу изделия";
const BLANK_WITHOUT_PRODUCT_MATERIAL_ERROR = "Нельзя выбрать заготовку, пока у изделия не выбран материал";
const PROCESS_LOCKED_ERROR = "Техпроцесс закрыт для редактирования";
const UPDATE_PROCESS_NO_RIGHTS_ERROR = "У вас нет прав для редактирования техпроцесса";
const DELETE_PROCESS_NO_RIGHTS_ERROR = "У вас нет прав для удаления техпроцесса";
const CHANGE_PROCESS_ACCESS_NO_RIGHTS_ERROR = "У вас нет прав для изменения доступа техпроцесса";
const UPDATE_PROCESS_SUCCESS_DESCRIPTION = "Отредактировано";

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

const isPrismaRecordNotFoundError = (error: unknown) =>
	Boolean(
		error
		&& typeof error === "object"
		&& "code" in error
		&& error.code === "P2025",
	);

const formatUserFullName = (user: { firstName: string; lastName: string; middleName: string | null }) =>
	[user.firstName, user.lastName, user.middleName].filter(Boolean).join(" ");

const formatProcessDateTime = (date: Date) =>
	new Intl.DateTimeFormat("ru-RU", {
		dateStyle: "short",
		timeStyle: "short",
	}).format(date);

const mapProcessFiles = (files: Array<{ id: number; originalName: string; size: number }>) =>
	files.map((file) => ({
		id: file.id,
		name: normalizeProcessFileOriginalName(file.originalName),
		size: file.size,
	}));

const getProcessPermissions = async (actorId: number) => {
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

const canEditProcess = (
	permissions: RolePermissions,
	process: { creatorId: number },
	actorId: number,
) => process.creatorId === actorId || hasPermission(permissions, "/products", "editingProcess");

const assertCanEditProcess = (
	permissions: RolePermissions,
	process: { creatorId: number; disabledById: number | null },
	actorId: number,
) => {
	if (process.disabledById !== null) {
		throw new AppError(423, PROCESS_LOCKED_ERROR);
	}

	if (!canEditProcess(permissions, process, actorId)) {
		throw new AppError(403, UPDATE_PROCESS_NO_RIGHTS_ERROR);
	}
};

const getProcessFileDuplicateKey = (file: { name: string; size: number }) =>
	`${normalizeProcessFileOriginalName(file.name).toLocaleLowerCase()}::${file.size}`;

const assertUniqueProcessStoredFiles = (
	existingFiles: Array<{ name: string; size: number }>,
	incomingFiles: Express.Multer.File[],
) => {
	const existingKeys = new Set(existingFiles.map((file) => getProcessFileDuplicateKey(file)));
	const incomingKeys = new Set<string>();

	for (const file of incomingFiles) {
		const normalizedFileName = normalizeProcessFileOriginalName(file.originalname);
		const key = getProcessFileDuplicateKey({
			name: normalizedFileName,
			size: file.size,
		});

		if (existingKeys.has(key) || incomingKeys.has(key)) {
			throw new AppError(409, `Файл "${normalizedFileName}" уже добавлен`);
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

const ensureProductExists = async (id: number) => {
	const product = await prisma.product.findUnique({
		where: { id },
		select: {
			id: true,
			materialId: true,
		},
	});

	if (!product) {
		throw new AppError(404, PRODUCT_NOT_FOUND_ERROR);
	}

	return product;
};

const ensureBlankMatchesProductMaterial = async (
	blankId: number | null | undefined,
	product: { materialId: number | null },
) => {
	if (blankId === undefined || blankId === null) {
		return;
	}

	if (product.materialId === null) {
		throw new AppError(400, BLANK_WITHOUT_PRODUCT_MATERIAL_ERROR);
	}

	const blank = await prisma.blank.findUnique({
		where: { id: blankId },
		select: {
			id: true,
			materialId: true,
		},
	});

	if (!blank) {
		throw new AppError(404, BLANK_NOT_FOUND_ERROR);
	}

	if (blank.materialId !== product.materialId) {
		throw new AppError(400, BLANK_MATERIAL_MISMATCH_ERROR);
	}
};

const parseProcessSearchId = (search?: string) => {
	if (!search || !/^[1-9]\d*$/.test(search)) {
		return null;
	}

	const id = Number(search);

	return Number.isSafeInteger(id) ? id : null;
};

const buildProcessesTableWhere = (query: GetProcessesTableQuery): Prisma.technologicalProcessWhereInput => {
	const filters: Prisma.technologicalProcessWhereInput = {
		productId: query.productId,
	};
	const search = query.search;

	if (search) {
		const searchId = parseProcessSearchId(search);
		const searchFilters: Prisma.technologicalProcessWhereInput[] = [
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
				blank: {
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

	if (typeof query.creatorId === "number") {
		filters.creatorId = query.creatorId;
	}

	if (typeof query.blankId === "number") {
		filters.blankId = query.blankId;
	}

	if (query.updatedAtFrom || query.updatedAtTo) {
		filters.updatedAt = {
			...(query.updatedAtFrom ? { gte: query.updatedAtFrom } : {}),
			...(query.updatedAtTo ? { lt: query.updatedAtTo } : {}),
		};
	}

	return filters;
};

const buildProcessesTableOrderBy = (
	sorting: GetProcessesTableQuery["sorting"],
): Prisma.technologicalProcessOrderByWithRelationInput[] => {
	if (!sorting) {
		return [{ id: "asc" }];
	}

	switch (sorting.id) {
		case "id":
			return [{ id: sorting.sort }];
		case "creator":
			return [
				{ creator: { lastName: sorting.sort } },
				{ creator: { firstName: sorting.sort } },
				{ creator: { middleName: sorting.sort } },
				{ id: "asc" },
			];
		case "blank":
			return [
				{ blank: { name: sorting.sort } },
				{ id: "asc" },
			];
		case "filesDownload":
			return [
				{ files: { _count: sorting.sort === "asc" ? "desc" : "asc" } },
				{ id: "asc" },
			];
		case "operationCount":
			return [
				{ operations: { _count: sorting.sort } },
				{ id: "asc" },
			];
		case "access":
			return [
				{ disabledById: sorting.sort },
				{ id: "asc" },
			];
		default:
			return [
				{ [sorting.id]: sorting.sort } as Prisma.technologicalProcessOrderByWithRelationInput,
				{ id: "asc" },
			];
	}
};

const mapProcess = <TProcess extends {
	files: Array<{ id: number; originalName: string; size: number }>;
	creator: { firstName: string; lastName: string; middleName: string | null; login: string };
	disabledBy: { firstName: string; lastName: string; middleName: string | null; login: string } | null;
}>(process: TProcess) => ({
	...process,
	creator: {
		...process.creator,
		fullName: formatUserFullName(process.creator),
	},
	disabledBy: process.disabledBy
		? {
				...process.disabledBy,
				fullName: formatUserFullName(process.disabledBy),
			}
		: null,
	files: mapProcessFiles(process.files),
	access: process.disabledBy === null,
});

export const getProcessesTable = async (
	query: GetProcessesTableQuery,
	actorId: number,
) => {
	await ensureProductExists(query.productId);
	const permissions = await getProcessPermissions(actorId);
	const where = buildProcessesTableWhere(query);
	const orderBy = buildProcessesTableOrderBy(query.sorting);
	const skip = query.page * query.rows;
	const canChangeAccess = hasPermission(permissions, "/products", "changeDisabledProcess");
	const [total, processes] = await prisma.$transaction([
		prisma.technologicalProcess.count({ where }),
		prisma.technologicalProcess.findMany({
			where,
			select: processTableSelect,
			orderBy,
			skip,
			take: query.rows,
		}),
	]);

	return {
		total,
		data: processes.map((process) => {
			const files = mapProcessFiles(process.files);
			const disabledBy = process.disabledBy ? formatUserFullName(process.disabledBy) : "";
			const disabledAt = process.disabledAt ? formatProcessDateTime(process.disabledAt) : "";
			const isLocked = process.disabledById !== null;
			const rowCanEdit = !isLocked && canEditProcess(permissions, process, actorId);

			return {
				id: process.id,
				name: process.name,
				description: process.description ?? "",
				creator: formatUserFullName(process.creator),
				blank: process.blank?.name ?? "",
				files,
				filesDownload: files.length ? "download" : "",
				operationCount: process._count.operations || "",
				access: !isLocked,
				accessTooltip: disabledBy
					? `Закрыт (${disabledBy}${disabledAt ? `, ${disabledAt}` : ""})`
					: "Открыт",
				canChangeAccess,
				canEdit: rowCanEdit,
				isLocked,
				createdAt: process.createdAt,
				updatedAt: process.updatedAt,
				isConst: isLocked || !rowCanEdit
					? Object.keys(PROCESS_TABLE_FIELD_TO_MODEL_FIELD)
					: [...processTableMeta.isConst],
				isRequired: [...processTableMeta.isRequired],
			};
		}),
	};
};

export const getProcessById = async (id: number) => {
	const process = await prisma.technologicalProcess.findUnique({
		where: { id },
		select: processSelect,
	});

	if (!process) {
		throw new AppError(404, PROCESS_NOT_FOUND_ERROR);
	}

	return mapProcess(process);
};

export const getProcessFileDownloadInfo = async (fileId: number) => {
	const processFile = await prisma.technologicalProcessFile.findUnique({
		where: { id: fileId },
		select: processFileDownloadSelect,
	});

	if (!processFile) {
		throw new AppError(404, PROCESS_FILE_NOT_FOUND_ERROR);
	}

	return {
		...processFile,
		originalName: normalizeProcessFileOriginalName(processFile.originalName),
	};
};

export const getProcessFilesArchiveInfo = async (processId: number) => {
	const process = await prisma.technologicalProcess.findUnique({
		where: { id: processId },
		select: processArchiveSelect,
	});

	if (!process) {
		throw new AppError(404, PROCESS_NOT_FOUND_ERROR);
	}

	return {
		...process,
		files: process.files.map((file) => ({
			...file,
			originalName: normalizeProcessFileOriginalName(file.originalName),
		})),
	};
};

export const createProcess = async (
	data: CreateProcessPayload,
	files: Express.Multer.File[],
	actorId: number,
) => {
	const product = await ensureProductExists(data.productId);
	await ensureBlankMatchesProductMaterial(data.blankId, product);
	assertUniqueProcessStoredFiles([], files);

	const savedFiles = await saveProcessFiles(files);

	try {
		const process = await prisma.technologicalProcess.create({
			data: {
				name: data.name,
				description: data.description,
				product: {
					connect: {
						id: data.productId,
					},
				},
				...(typeof data.blankId === "number"
					? {
							blank: {
								connect: {
									id: data.blankId,
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
			},
			select: processSelect,
		});

		return mapProcess(process);
	} catch (error) {
		await cleanupStoredFiles(savedFiles.map((file) => file.absolutePath));

		throw error;
	}
};

export const updateProcess = async (
	id: number,
	data: UpdateProcessPayload,
	files: Express.Multer.File[],
	actorId: number,
) => {
	const currentProcess = await prisma.technologicalProcess.findUnique({
		where: { id },
		select: processUpdateSelect,
	});

	if (!currentProcess) {
		throw new AppError(404, PROCESS_NOT_FOUND_ERROR);
	}

	const permissions = await getProcessPermissions(actorId);
	assertCanEditProcess(permissions, currentProcess, actorId);

	if (data.blankId !== undefined) {
		await ensureBlankMatchesProductMaterial(data.blankId, currentProcess.product);
	}

	const removedFileIds = getUniqueIds(data.removedFileIds ?? []);
	const currentFilesById = new Map(currentProcess.files.map((file) => [file.id, file]));
	const removedFiles = removedFileIds
		.map((fileId) => currentFilesById.get(fileId))
		.filter((file): file is (typeof currentProcess.files)[number] => Boolean(file));

	if (removedFiles.length !== removedFileIds.length) {
		throw new AppError(400, PROCESS_FILE_NOT_FOUND_ERROR);
	}

	const remainingFiles = currentProcess.files.filter((file) => !removedFileIds.includes(file.id));
	const totalFilesCount = remainingFiles.length + files.length;
	const totalFilesSize = remainingFiles.reduce((result, file) => result + file.size, 0)
		+ files.reduce((result, file) => result + file.size, 0);

	assertUniqueProcessStoredFiles(
		remainingFiles.map((file) => ({
			name: file.originalName,
			size: file.size,
		})),
		files,
	);

	if (totalFilesCount > PROCESS_FILES_LIMIT) {
		throw new AppError(400, "Можно хранить не более 20 файлов у одного техпроцесса");
	}

	if (totalFilesSize > PROCESS_FILES_TOTAL_SIZE_LIMIT) {
		throw new AppError(413, "Общий размер файлов техпроцесса не должен превышать 200 MB");
	}

	const savedFiles = await saveProcessFiles(files);

	try {
		const process = await prisma.technologicalProcess.update({
			where: { id },
			data: {
				name: data.name,
				description: data.description,
				...(data.blankId !== undefined
					? {
							blank: {
								...(typeof data.blankId === "number"
									? {
											connect: {
												id: data.blankId,
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
			},
			select: processSelect,
		});

		if (removedFiles.length) {
			const removedAbsolutePaths = removedFiles
				.map((file) => getProcessFileAbsolutePath(file.storagePath))
				.filter((absolutePath): absolutePath is string => Boolean(absolutePath));
			await cleanupStoredFiles(removedAbsolutePaths);
		}

		return mapProcess(process);
	} catch (error) {
		await cleanupStoredFiles(savedFiles.map((file) => file.absolutePath));

		throw error;
	}
};

export const updateProcessAccess = async (
	id: number,
	data: UpdateProcessAccessPayload,
	actorId: number,
) => {
	const permissions = await getProcessPermissions(actorId);

	if (!hasPermission(permissions, "/products", "changeDisabledProcess")) {
		throw new AppError(403, CHANGE_PROCESS_ACCESS_NO_RIGHTS_ERROR);
	}

	try {
		const now = new Date();
		const process = await prisma.technologicalProcess.update({
			where: { id },
			data: {
				disabledBy: data.disabled
					? {
							connect: {
								id: actorId,
							},
						}
					: {
							disconnect: true,
						},
				disabledAt: data.disabled ? now : null,
				updatedAt: now,
			},
			select: processSelect,
		});

		return mapProcess(process);
	} catch (error) {
		if (isPrismaRecordNotFoundError(error)) {
			throw new AppError(404, PROCESS_NOT_FOUND_ERROR);
		}

		throw error;
	}
};

export const updateProcessesTable = async (
	payload: UpdateProcessesTablePayload,
	actorId: number,
): Promise<ActionByTableResult> => {
	const ids = Object.keys(payload).map((id) => Number(id));
	const result: ActionByTableResult = {
		success: [],
		error: [],
	};

	for (const [rawId, rawItem] of Object.entries(payload)) {
		const id = Number(rawId);
		const parsedItem = updateProcessesTableItemSchema.safeParse(rawItem);

		if (!parsedItem.success) {
			result.error.push({
				id,
				description: getValidationErrorMessage(parsedItem.error.issues) || "Некорректные данные",
			});
			continue;
		}

		try {
			await updateProcess(id, parsedItem.data, [], actorId);
			result.success.push({
				id,
				description: UPDATE_PROCESS_SUCCESS_DESCRIPTION,
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

	if (!result.success.length && !result.error.length) {
		return {
			success: [],
			error: ids.map((id) => ({
				id,
				description: UPDATE_PROCESS_NO_RIGHTS_ERROR,
			})),
		};
	}

	return result;
};

export const deleteProcesses = async (
	ids: number[],
	actorId: number,
): Promise<ActionByTableResult> => {
	const uniqueIds = getUniqueIds(ids);
	const permissions = await getProcessPermissions(actorId);

	if (!hasPermission(permissions, "/products", "removingProcess")) {
		return {
			success: [],
			error: uniqueIds.map((id) => ({
				id,
				description: DELETE_PROCESS_NO_RIGHTS_ERROR,
			})),
		};
	}

	const existingProcesses = await prisma.technologicalProcess.findMany({
		where: {
			id: {
				in: uniqueIds,
			},
		},
		select: {
			id: true,
			disabledById: true,
		},
	});
	const processesById = new Map(existingProcesses.map((process) => [process.id, process]));
	const result: ActionByTableResult = {
		success: [],
		error: [],
	};

	for (const id of uniqueIds) {
		const existingProcess = processesById.get(id);

		if (!existingProcess) {
			result.error.push({
				id,
				description: PROCESS_NOT_FOUND_ERROR,
			});
			continue;
		}

		if (existingProcess.disabledById !== null) {
			result.error.push({
				id,
				description: PROCESS_LOCKED_ERROR,
			});
			continue;
		}

		try {
			const deletedProcess = await prisma.technologicalProcess.delete({
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
			const deletedAbsolutePaths = deletedProcess.files
				.map((file) => getProcessFileAbsolutePath(file.storagePath))
				.filter((absolutePath): absolutePath is string => Boolean(absolutePath));
			await cleanupStoredFiles(deletedAbsolutePaths);
			result.success.push({
				id,
				description: "Удалено",
			});
		} catch (error) {
			if (isPrismaRecordNotFoundError(error)) {
				result.error.push({
					id,
					description: PROCESS_NOT_FOUND_ERROR,
				});
				continue;
			}

			throw error;
		}
	}

	return result;
};
