import type { Prisma } from "../../generated/prisma/client.js";
import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../shared/errors/app-error.js";
import { hasPermission } from "../../shared/http/permissions.js";
import { removeStoredFile } from "../../shared/storage/avatars.js";
import {
	PROCESS_OPERATION_FILES_LIMIT,
	PROCESS_OPERATION_FILES_TOTAL_SIZE_LIMIT,
	getProcessOperationFileAbsolutePath,
	normalizeProcessOperationFileOriginalName,
	saveProcessOperationFiles,
} from "../../shared/storage/process-operations.js";
import type { RolePermissions } from "../roles/role.types.js";
import type {
	GetProcessOperationsQuery,
	GetProcessOperationsTableQuery,
	UpdateProcessOperationPayload,
	UpdateProcessOperationsPayload,
} from "./process-operation.schemas.js";

const processOperationFileSelect = {
	id: true,
	originalName: true,
	size: true,
	mimeType: true,
	storagePath: true,
} satisfies Prisma.processOperationFileSelect;

const processOperationTableSelect = {
	id: true,
	processId: true,
	operationId: true,
	sortOrder: true,
	exit: true,
	description: true,
	createdAt: true,
	updatedAt: true,
	operation: {
		select: {
			id: true,
			name: true,
			description: true,
			operationGroup: {
				select: {
					id: true,
					name: true,
					description: true,
				},
			},
		},
	},
	process: {
		select: {
			creatorId: true,
			disabledById: true,
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
} satisfies Prisma.processOperationSelect;

const processOperationSelect = {
	id: true,
	processId: true,
	operationId: true,
	sortOrder: true,
	exit: true,
	description: true,
	createdAt: true,
	updatedAt: true,
	process: {
		select: {
			id: true,
			name: true,
			creatorId: true,
			disabledById: true,
		},
	},
	operation: {
		select: {
			id: true,
			name: true,
			description: true,
			operationGroupId: true,
			operationGroup: {
				select: {
					id: true,
					name: true,
					description: true,
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
		},
	},
	files: {
		select: processOperationFileSelect,
		orderBy: {
			id: "asc",
		},
	},
} satisfies Prisma.processOperationSelect;

const processOperationUpdateSelect = {
	id: true,
	processId: true,
	operationId: true,
	exit: true,
	description: true,
	process: {
		select: {
			creatorId: true,
			disabledById: true,
		},
	},
	files: {
		select: processOperationFileSelect,
		orderBy: {
			id: "asc",
		},
	},
} satisfies Prisma.processOperationSelect;

const processOperationFileDownloadSelect = {
	id: true,
	originalName: true,
	storagePath: true,
} satisfies Prisma.processOperationFileSelect;

const processOperationArchiveSelect = {
	id: true,
	operation: {
		select: {
			name: true,
		},
	},
	files: {
		select: processOperationFileDownloadSelect,
		orderBy: {
			id: "asc",
		},
	},
} satisfies Prisma.processOperationSelect;

const PROCESS_OPERATION_TABLE_FIELDS = [
	"index",
	"name",
	"tpz",
	"tsht",
	"stepCount",
	"operationGroup",
	"filesDownload",
	"exit",
	"description",
] as const;

const PROCESS_NOT_FOUND_ERROR = "Техпроцесс не найден";
const PROCESS_OPERATION_NOT_FOUND_ERROR = "Операция техпроцесса не найдена";
const PROCESS_OPERATION_FILE_NOT_FOUND_ERROR = "Файл операции техпроцесса не найден";
const GUIDE_OPERATION_NOT_FOUND_ERROR = "Операция из справочника не найдена";
const PROCESS_LOCKED_ERROR = "Техпроцесс закрыт для редактирования";
const UPDATE_PROCESS_OPERATION_NO_RIGHTS_ERROR = "У вас нет прав для редактирования операций техпроцесса";

const parseProcessOperationSearchId = (search?: string) => {
	if (!search || !/^[1-9]\d*$/.test(search)) {
		return null;
	}

	const id = Number(search);

	return Number.isSafeInteger(id) ? id : null;
};

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

const mapProcessOperationFiles = (files: Array<{ id: number; originalName: string; size: number }>) =>
	files.map((file) => ({
		id: file.id,
		name: normalizeProcessOperationFileOriginalName(file.originalName),
		size: file.size,
	}));

const getProcessOperationPermissions = async (actorId: number) => {
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

const canEditProcessOperations = (
	permissions: RolePermissions,
	process: { creatorId: number },
	actorId: number,
) => process.creatorId === actorId || hasPermission(permissions, "/products", "editingProcess");

const assertCanEditProcessOperations = (
	permissions: RolePermissions,
	process: { creatorId: number; disabledById: number | null },
	actorId: number,
) => {
	if (process.disabledById !== null) {
		throw new AppError(423, PROCESS_LOCKED_ERROR);
	}

	if (!canEditProcessOperations(permissions, process, actorId)) {
		throw new AppError(403, UPDATE_PROCESS_OPERATION_NO_RIGHTS_ERROR);
	}
};

const cleanupStoredFiles = async (absolutePaths: string[]) => {
	const results = await Promise.allSettled(absolutePaths.map((absolutePath) => removeStoredFile(absolutePath)));
	const rejectedResult = results.find((result): result is PromiseRejectedResult => result.status === "rejected");

	if (rejectedResult) {
		throw rejectedResult.reason;
	}
};

const getProcessOperationFileDuplicateKey = (file: { name: string; size: number }) =>
	`${normalizeProcessOperationFileOriginalName(file.name).toLocaleLowerCase()}::${file.size}`;

const assertUniqueProcessOperationStoredFiles = (
	existingFiles: Array<{ name: string; size: number }>,
	incomingFiles: Express.Multer.File[],
) => {
	const existingKeys = new Set(existingFiles.map((file) => getProcessOperationFileDuplicateKey(file)));
	const incomingKeys = new Set<string>();

	for (const file of incomingFiles) {
		const normalizedFileName = normalizeProcessOperationFileOriginalName(file.originalname);
		const key = getProcessOperationFileDuplicateKey({
			name: normalizedFileName,
			size: file.size,
		});

		if (existingKeys.has(key) || incomingKeys.has(key)) {
			throw new AppError(409, `Файл "${normalizedFileName}" уже добавлен`);
		}

		incomingKeys.add(key);
	}
};

const ensureProcessExists = async (id: number) => {
	const process = await prisma.technologicalProcess.findUnique({
		where: { id },
		select: {
			id: true,
			creatorId: true,
			disabledById: true,
		},
	});

	if (!process) {
		throw new AppError(404, PROCESS_NOT_FOUND_ERROR);
	}

	return process;
};

const buildProcessOperationsTableWhere = (query: GetProcessOperationsTableQuery): Prisma.processOperationWhereInput => {
	const filters: Prisma.processOperationWhereInput = {
		processId: query.processId,
	};

	if (query.search) {
		const searchId = parseProcessOperationSearchId(query.search);
		const searchFilters: Prisma.processOperationWhereInput[] = [
			{
				description: {
					contains: query.search,
					mode: "insensitive",
				},
			},
			{
				operation: {
					is: {
						name: {
							contains: query.search,
							mode: "insensitive",
						},
					},
				},
			},
			{
				operation: {
					is: {
						description: {
							contains: query.search,
							mode: "insensitive",
						},
					},
				},
			},
			{
				operation: {
					is: {
						operationGroup: {
							is: {
								name: {
									contains: query.search,
									mode: "insensitive",
								},
							},
						},
					},
				},
			},
		];

		if (searchId !== null) {
			searchFilters.unshift(
				{ id: searchId },
				{ operationId: searchId },
			);
		}

		filters.OR = searchFilters;
	}

	if (typeof query.operationGroupId === "number") {
		filters.operation = {
			is: {
				operationGroupId: query.operationGroupId,
			},
		};
	}

	return filters;
};

const buildProcessOperationsTableOrderBy = (
	sorting: GetProcessOperationsTableQuery["sorting"],
): Prisma.processOperationOrderByWithRelationInput[] => {
	if (!sorting) {
		return [
			{ sortOrder: "asc" },
			{ id: "asc" },
		];
	}

	switch (sorting.id) {
		case "index":
			return [
				{ sortOrder: sorting.sort },
				{ id: "asc" },
			];
		case "name":
			return [
				{ operation: { name: sorting.sort } },
				{ sortOrder: "asc" },
				{ id: "asc" },
			];
		case "operationGroup":
			return [
				{ operation: { operationGroup: { name: sorting.sort } } },
				{ sortOrder: "asc" },
				{ id: "asc" },
			];
		case "filesDownload":
			return [
				{ files: { _count: sorting.sort === "asc" ? "desc" : "asc" } },
				{ sortOrder: "asc" },
				{ id: "asc" },
			];
		case "exit":
			return [
				{ exit: sorting.sort },
				{ sortOrder: "asc" },
				{ id: "asc" },
			];
		case "description":
			return [
				{ description: sorting.sort },
				{ sortOrder: "asc" },
				{ id: "asc" },
			];
		default:
			return [
				{ sortOrder: "asc" },
				{ id: "asc" },
			];
	}
};

const mapSelectedProcessOperation = <TOperation extends {
	id: number;
	operationId: number;
	sortOrder: number;
	operation: {
		id: number;
		name: string;
		operationGroup: {
			id: number;
			name: string;
		};
	};
}>(operation: TOperation) => ({
	id: operation.id,
	operationId: operation.operationId,
	name: operation.operation.name,
	operationGroup: operation.operation.operationGroup.name,
	operationGroupId: operation.operation.operationGroup.id,
	sortOrder: operation.sortOrder,
});

export const getProcessOperationsTable = async (
	query: GetProcessOperationsTableQuery,
	actorId: number,
) => {
	const process = await ensureProcessExists(query.processId);
	const permissions = await getProcessOperationPermissions(actorId);
	const where = buildProcessOperationsTableWhere(query);
	const orderBy = buildProcessOperationsTableOrderBy(query.sorting);
	const skip = query.page * query.rows;
	const canEdit = canEditProcessOperations(permissions, process, actorId) && process.disabledById === null;
	const [total, operations] = await prisma.$transaction([
		prisma.processOperation.count({ where }),
		prisma.processOperation.findMany({
			where,
			select: processOperationTableSelect,
			orderBy,
			skip,
			take: query.rows,
		}),
	]);

	return {
		total,
		data: operations.map((operation) => {
			const files = mapProcessOperationFiles(operation.files);
			const rowCanEdit = canEdit && operation.process.disabledById === null;

			return {
				id: operation.id,
				index: operation.sortOrder + 1,
				name: operation.operation.name,
				tpz: "",
				tsht: "",
				stepCount: "",
				operationGroup: operation.operation.operationGroup.name,
				files,
				filesDownload: files.length ? "download" : "",
				exit: operation.exit ?? "",
				description: operation.description ?? "",
				operationId: operation.operationId,
				canEdit: rowCanEdit,
				createdAt: operation.createdAt,
				updatedAt: operation.updatedAt,
				isConst: PROCESS_OPERATION_TABLE_FIELDS,
				isRequired: [],
			};
		}),
	};
};

export const listProcessOperations = async (query: GetProcessOperationsQuery) => {
	await ensureProcessExists(query.processId);

	const operations = await prisma.processOperation.findMany({
		where: {
			processId: query.processId,
		},
		select: {
			id: true,
			operationId: true,
			sortOrder: true,
			operation: {
				select: {
					id: true,
					name: true,
					operationGroup: {
						select: {
							id: true,
							name: true,
						},
					},
				},
			},
		},
		orderBy: [
			{ sortOrder: "asc" },
			{ id: "asc" },
		],
	});

	return operations.map(mapSelectedProcessOperation);
};

export const getProcessOperationById = async (id: number) => {
	const processOperation = await prisma.processOperation.findUnique({
		where: { id },
		select: processOperationSelect,
	});

	if (!processOperation) {
		throw new AppError(404, PROCESS_OPERATION_NOT_FOUND_ERROR);
	}

	return {
		...processOperation,
		files: mapProcessOperationFiles(processOperation.files),
		operation: {
			...processOperation.operation,
			files: processOperation.operation.files.map((file) => ({
				id: file.id,
				name: file.originalName,
				size: file.size,
			})),
		},
	};
};

export const updateProcessOperations = async (
	processId: number,
	data: UpdateProcessOperationsPayload,
	actorId: number,
) => {
	const process = await ensureProcessExists(processId);
	const permissions = await getProcessOperationPermissions(actorId);
	assertCanEditProcessOperations(permissions, process, actorId);

	const operationIds = getUniqueIds(data.operationIds);
	const operationsCount = operationIds.length
		? await prisma.operation.count({
				where: {
					id: {
						in: operationIds,
					},
				},
			})
		: 0;

	if (operationsCount !== operationIds.length) {
		throw new AppError(404, GUIDE_OPERATION_NOT_FOUND_ERROR);
	}

	const currentOperations = await prisma.processOperation.findMany({
		where: { processId },
		select: {
			id: true,
			operationId: true,
			files: {
				select: {
					storagePath: true,
				},
			},
		},
	});
	const nextOperationIds = new Set(operationIds);
	const removedOperations = currentOperations.filter((operation) => !nextOperationIds.has(operation.operationId));

	await prisma.$transaction(async (tx) => {
		if (removedOperations.length) {
			await tx.processOperation.deleteMany({
				where: {
					id: {
						in: removedOperations.map((operation) => operation.id),
					},
				},
			});
		}

		for (const [sortOrder, operationId] of operationIds.entries()) {
			await tx.processOperation.upsert({
				where: {
					processId_operationId: {
						processId,
						operationId,
					},
				},
				update: {
					sortOrder,
				},
				create: {
					processId,
					operationId,
					sortOrder,
				},
			});
		}
	});

	if (removedOperations.length) {
		const removedAbsolutePaths = removedOperations
			.flatMap((operation) => operation.files)
			.map((file) => getProcessOperationFileAbsolutePath(file.storagePath))
			.filter((absolutePath): absolutePath is string => Boolean(absolutePath));
		await cleanupStoredFiles(removedAbsolutePaths);
	}

	return listProcessOperations({ processId });
};

export const updateProcessOperation = async (
	id: number,
	data: UpdateProcessOperationPayload,
	files: Express.Multer.File[],
	actorId: number,
) => {
	const currentProcessOperation = await prisma.processOperation.findUnique({
		where: { id },
		select: processOperationUpdateSelect,
	});

	if (!currentProcessOperation) {
		throw new AppError(404, PROCESS_OPERATION_NOT_FOUND_ERROR);
	}

	const permissions = await getProcessOperationPermissions(actorId);
	assertCanEditProcessOperations(permissions, currentProcessOperation.process, actorId);

	const removedFileIds = getUniqueIds(data.removedFileIds ?? []);
	const currentFilesById = new Map(currentProcessOperation.files.map((file) => [file.id, file]));
	const removedFiles = removedFileIds
		.map((fileId) => currentFilesById.get(fileId))
		.filter((file): file is (typeof currentProcessOperation.files)[number] => Boolean(file));

	if (removedFiles.length !== removedFileIds.length) {
		throw new AppError(400, PROCESS_OPERATION_FILE_NOT_FOUND_ERROR);
	}

	const remainingFiles = currentProcessOperation.files.filter((file) => !removedFileIds.includes(file.id));
	const totalFilesCount = remainingFiles.length + files.length;
	const totalFilesSize = remainingFiles.reduce((result, file) => result + file.size, 0)
		+ files.reduce((result, file) => result + file.size, 0);

	assertUniqueProcessOperationStoredFiles(
		remainingFiles.map((file) => ({
			name: file.originalName,
			size: file.size,
		})),
		files,
	);

	if (totalFilesCount > PROCESS_OPERATION_FILES_LIMIT) {
		throw new AppError(400, "Можно хранить не более 20 файлов у одной операции техпроцесса");
	}

	if (totalFilesSize > PROCESS_OPERATION_FILES_TOTAL_SIZE_LIMIT) {
		throw new AppError(413, "Общий размер файлов операции не должен превышать 200 MB");
	}

	const savedFiles = await saveProcessOperationFiles(files);

	try {
		const processOperation = await prisma.processOperation.update({
			where: { id },
			data: {
				...(data.exit !== undefined ? { exit: data.exit } : {}),
				...(data.description !== undefined ? { description: data.description } : {}),
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
			select: processOperationSelect,
		});

		if (removedFiles.length) {
			const removedAbsolutePaths = removedFiles
				.map((file) => getProcessOperationFileAbsolutePath(file.storagePath))
				.filter((absolutePath): absolutePath is string => Boolean(absolutePath));
			await cleanupStoredFiles(removedAbsolutePaths);
		}

		return {
			...processOperation,
			files: mapProcessOperationFiles(processOperation.files),
			operation: {
				...processOperation.operation,
				files: processOperation.operation.files.map((file) => ({
					id: file.id,
					name: file.originalName,
					size: file.size,
				})),
			},
		};
	} catch (error) {
		await cleanupStoredFiles(savedFiles.map((file) => file.absolutePath));

		throw error;
	}
};

export const getProcessOperationFileDownloadInfo = async (fileId: number) => {
	const processOperationFile = await prisma.processOperationFile.findUnique({
		where: { id: fileId },
		select: processOperationFileDownloadSelect,
	});

	if (!processOperationFile) {
		throw new AppError(404, PROCESS_OPERATION_FILE_NOT_FOUND_ERROR);
	}

	return {
		...processOperationFile,
		originalName: normalizeProcessOperationFileOriginalName(processOperationFile.originalName),
	};
};

export const getProcessOperationFilesArchiveInfo = async (processOperationId: number) => {
	const processOperation = await prisma.processOperation.findUnique({
		where: { id: processOperationId },
		select: processOperationArchiveSelect,
	});

	if (!processOperation) {
		throw new AppError(404, PROCESS_OPERATION_NOT_FOUND_ERROR);
	}

	return {
		...processOperation,
		name: processOperation.operation.name,
		files: processOperation.files.map((file) => ({
			...file,
			originalName: normalizeProcessOperationFileOriginalName(file.originalName),
		})),
	};
};
