import type { Prisma } from "../../generated/prisma/client.js";
import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../shared/errors/app-error.js";
import { hasPermission } from "../../shared/http/permissions.js";
import { removeStoredFile } from "../../shared/storage/avatars.js";
import {
	PROCESS_STEP_FILES_LIMIT,
	PROCESS_STEP_FILES_TOTAL_SIZE_LIMIT,
	getProcessStepFileAbsolutePath,
	normalizeProcessStepFileOriginalName,
	saveProcessStepFiles,
} from "../../shared/storage/process-steps.js";
import type { RolePermissions } from "../roles/role.types.js";
import type {
	CreateProcessStepPayload,
	GetProcessStepsQuery,
	GetProcessStepsTableQuery,
	UpdateProcessStepPayload,
	UpdateProcessStepsPayload,
} from "./process-step.schemas.js";

export type ProcessStepFilesByClientId = Map<string, Express.Multer.File[]>;

const processStepFileSelect = {
	id: true,
	originalName: true,
	size: true,
	mimeType: true,
	storagePath: true,
} satisfies Prisma.processStepFileSelect;

const processStepTableSelect = {
	id: true,
	processOperationId: true,
	sortOrder: true,
	name: true,
	description: true,
	createdAt: true,
	updatedAt: true,
	processOperation: {
		select: {
			process: {
				select: {
					creatorId: true,
					disabledById: true,
				},
			},
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
} satisfies Prisma.processStepSelect;

const processStepSelect = {
	id: true,
	processOperationId: true,
	sortOrder: true,
	name: true,
	description: true,
	createdAt: true,
	updatedAt: true,
	processOperation: {
		select: {
			id: true,
			processId: true,
			operation: {
				select: {
					id: true,
					name: true,
				},
			},
			process: {
				select: {
					id: true,
					name: true,
					productId: true,
					creatorId: true,
					disabledById: true,
				},
			},
		},
	},
	files: {
		select: processStepFileSelect,
		orderBy: {
			id: "asc",
		},
	},
} satisfies Prisma.processStepSelect;

const processStepUpdateSelect = {
	id: true,
	processOperationId: true,
	name: true,
	description: true,
	processOperation: {
		select: {
			process: {
				select: {
					creatorId: true,
					disabledById: true,
				},
			},
		},
	},
	files: {
		select: processStepFileSelect,
		orderBy: {
			id: "asc",
		},
	},
} satisfies Prisma.processStepSelect;

const processStepFileDownloadSelect = {
	id: true,
	originalName: true,
	storagePath: true,
} satisfies Prisma.processStepFileSelect;

const processStepArchiveSelect = {
	id: true,
	name: true,
	files: {
		select: processStepFileDownloadSelect,
		orderBy: {
			id: "asc",
		},
	},
} satisfies Prisma.processStepSelect;

const PROCESS_STEP_TABLE_FIELDS = [
	"index",
	"name",
	"tpz",
	"tsht",
	"workCount",
	"filesDownload",
	"description",
] as const;

const PROCESS_STEP_READONLY_TABLE_FIELDS = [
	"index",
	"tpz",
	"tsht",
	"workCount",
	"filesDownload",
] as const;

const PROCESS_OPERATION_NOT_FOUND_ERROR = "Операция техпроцесса не найдена";
const PROCESS_STEP_NOT_FOUND_ERROR = "Этап не найден";
const PROCESS_STEP_FILE_NOT_FOUND_ERROR = "Файл этапа не найден";
const PROCESS_LOCKED_ERROR = "Техпроцесс закрыт для редактирования";
const UPDATE_PROCESS_STEP_NO_RIGHTS_ERROR = "У вас нет прав для редактирования этапов";

const parseProcessStepSearchId = (search?: string) => {
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

const mapProcessStepFiles = (files: Array<{ id: number; originalName: string; size: number }>) =>
	files.map((file) => ({
		id: file.id,
		name: normalizeProcessStepFileOriginalName(file.originalName),
		size: file.size,
	}));

const getProcessStepPermissions = async (actorId: number) => {
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

const canEditProcessSteps = (
	permissions: RolePermissions,
	process: { creatorId: number },
	actorId: number,
) => process.creatorId === actorId || hasPermission(permissions, "/products", "editingProcess");

const assertCanEditProcessSteps = (
	permissions: RolePermissions,
	process: { creatorId: number; disabledById: number | null },
	actorId: number,
) => {
	if (process.disabledById !== null) {
		throw new AppError(423, PROCESS_LOCKED_ERROR);
	}

	if (!canEditProcessSteps(permissions, process, actorId)) {
		throw new AppError(403, UPDATE_PROCESS_STEP_NO_RIGHTS_ERROR);
	}
};

const cleanupStoredFiles = async (absolutePaths: string[]) => {
	const results = await Promise.allSettled(absolutePaths.map((absolutePath) => removeStoredFile(absolutePath)));
	const rejectedResult = results.find((result): result is PromiseRejectedResult => result.status === "rejected");

	if (rejectedResult) {
		throw rejectedResult.reason;
	}
};

const getProcessStepFileDuplicateKey = (file: { name: string; size: number }) =>
	`${normalizeProcessStepFileOriginalName(file.name).toLocaleLowerCase()}::${file.size}`;

const assertUniqueProcessStepStoredFiles = (
	existingFiles: Array<{ name: string; size: number }>,
	incomingFiles: Express.Multer.File[],
) => {
	const existingKeys = new Set(existingFiles.map((file) => getProcessStepFileDuplicateKey(file)));
	const incomingKeys = new Set<string>();

	for (const file of incomingFiles) {
		const normalizedFileName = normalizeProcessStepFileOriginalName(file.originalname);
		const key = getProcessStepFileDuplicateKey({
			name: normalizedFileName,
			size: file.size,
		});

		if (existingKeys.has(key) || incomingKeys.has(key)) {
			throw new AppError(409, `Файл "${normalizedFileName}" уже добавлен`);
		}

		incomingKeys.add(key);
	}
};

const assertProcessStepFilesLimits = (
	remainingFiles: Array<{ originalName: string; size: number }>,
	files: Express.Multer.File[],
) => {
	const totalFilesCount = remainingFiles.length + files.length;
	const totalFilesSize = remainingFiles.reduce((result, file) => result + file.size, 0)
		+ files.reduce((result, file) => result + file.size, 0);

	assertUniqueProcessStepStoredFiles(
		remainingFiles.map((file) => ({
			name: file.originalName,
			size: file.size,
		})),
		files,
	);

	if (totalFilesCount > PROCESS_STEP_FILES_LIMIT) {
		throw new AppError(400, "Можно хранить не более 20 файлов у одного этапа");
	}

	if (totalFilesSize > PROCESS_STEP_FILES_TOTAL_SIZE_LIMIT) {
		throw new AppError(413, "Общий размер файлов этапа не должен превышать 200 MB");
	}
};

const ensureProcessOperationExists = async (id: number) => {
	const processOperation = await prisma.processOperation.findUnique({
		where: { id },
		select: {
			id: true,
			process: {
				select: {
					creatorId: true,
					disabledById: true,
				},
			},
		},
	});

	if (!processOperation) {
		throw new AppError(404, PROCESS_OPERATION_NOT_FOUND_ERROR);
	}

	return processOperation;
};

const buildProcessStepsTableWhere = (query: GetProcessStepsTableQuery): Prisma.processStepWhereInput => {
	const filters: Prisma.processStepWhereInput = {
		processOperationId: query.operationId,
	};

	if (query.search) {
		const searchId = parseProcessStepSearchId(query.search);
		const searchFilters: Prisma.processStepWhereInput[] = [
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
		];

		if (searchId !== null) {
			searchFilters.unshift({ id: searchId });
		}

		filters.OR = searchFilters;
	}

	return filters;
};

const buildProcessStepsTableOrderBy = (
	sorting: GetProcessStepsTableQuery["sorting"],
): Prisma.processStepOrderByWithRelationInput[] => {
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
				{ name: sorting.sort },
				{ sortOrder: "asc" },
				{ id: "asc" },
			];
		case "filesDownload":
			return [
				{ files: { _count: sorting.sort === "asc" ? "desc" : "asc" } },
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

const mapSelectedProcessStep = <TStep extends {
	id: number;
	sortOrder: number;
	name: string;
	description: string | null;
	files: Array<{ id: number; originalName: string; size: number }>;
}>(step: TStep) => ({
	id: step.id,
	clientId: `step-${step.id}`,
	sortOrder: step.sortOrder,
	name: step.name,
	description: step.description ?? "",
	files: mapProcessStepFiles(step.files),
});

export const getProcessStepsTable = async (
	query: GetProcessStepsTableQuery,
	actorId: number,
) => {
	const processOperation = await ensureProcessOperationExists(query.operationId);
	const permissions = await getProcessStepPermissions(actorId);
	const where = buildProcessStepsTableWhere(query);
	const orderBy = buildProcessStepsTableOrderBy(query.sorting);
	const skip = query.page * query.rows;
	const canEdit = canEditProcessSteps(permissions, processOperation.process, actorId)
		&& processOperation.process.disabledById === null;
	const [total, steps] = await prisma.$transaction([
		prisma.processStep.count({ where }),
		prisma.processStep.findMany({
			where,
			select: processStepTableSelect,
			orderBy,
			skip,
			take: query.rows,
		}),
	]);

	return {
		total,
		data: steps.map((step) => {
			const files = mapProcessStepFiles(step.files);
			const rowCanEdit = canEdit && step.processOperation.process.disabledById === null;

			return {
				id: step.id,
				index: step.sortOrder + 1,
				name: step.name,
				tpz: "",
				tsht: "",
				workCount: "",
				files,
				filesDownload: files.length ? "download" : "",
				description: step.description ?? "",
				canEdit: rowCanEdit,
				createdAt: step.createdAt,
				updatedAt: step.updatedAt,
				isConst: rowCanEdit ? PROCESS_STEP_READONLY_TABLE_FIELDS : PROCESS_STEP_TABLE_FIELDS,
				isRequired: rowCanEdit ? ["name"] : [],
			};
		}),
	};
};

export const listProcessSteps = async (query: GetProcessStepsQuery) => {
	await ensureProcessOperationExists(query.operationId);

	const steps = await prisma.processStep.findMany({
		where: {
			processOperationId: query.operationId,
		},
		select: {
			id: true,
			sortOrder: true,
			name: true,
			description: true,
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
		orderBy: [
			{ sortOrder: "asc" },
			{ id: "asc" },
		],
	});

	return steps.map(mapSelectedProcessStep);
};

export const getProcessStepById = async (id: number) => {
	const processStep = await prisma.processStep.findUnique({
		where: { id },
		select: processStepSelect,
	});

	if (!processStep) {
		throw new AppError(404, PROCESS_STEP_NOT_FOUND_ERROR);
	}

	return {
		...processStep,
		files: mapProcessStepFiles(processStep.files),
	};
};

export const createProcessStep = async (
	processOperationId: number,
	data: CreateProcessStepPayload,
	files: Express.Multer.File[],
	actorId: number,
) => {
	const processOperation = await ensureProcessOperationExists(processOperationId);
	const permissions = await getProcessStepPermissions(actorId);
	assertCanEditProcessSteps(permissions, processOperation.process, actorId);
	assertProcessStepFilesLimits([], files);

	const savedFiles = await saveProcessStepFiles(files);

	try {
		const stepCount = await prisma.processStep.count({
			where: { processOperationId },
		});
		const processStep = await prisma.processStep.create({
			data: {
				processOperationId,
				sortOrder: stepCount,
				name: data.name,
				description: data.description,
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
			select: processStepSelect,
		});

		return {
			...processStep,
			files: mapProcessStepFiles(processStep.files),
		};
	} catch (error) {
		await cleanupStoredFiles(savedFiles.map((file) => file.absolutePath));
		throw error;
	}
};

export const updateProcessStep = async (
	id: number,
	data: UpdateProcessStepPayload,
	files: Express.Multer.File[],
	actorId: number,
) => {
	const currentProcessStep = await prisma.processStep.findUnique({
		where: { id },
		select: processStepUpdateSelect,
	});

	if (!currentProcessStep) {
		throw new AppError(404, PROCESS_STEP_NOT_FOUND_ERROR);
	}

	const permissions = await getProcessStepPermissions(actorId);
	assertCanEditProcessSteps(permissions, currentProcessStep.processOperation.process, actorId);

	const removedFileIds = getUniqueIds(data.removedFileIds ?? []);
	const currentFilesById = new Map(currentProcessStep.files.map((file) => [file.id, file]));
	const removedFiles = removedFileIds
		.map((fileId) => currentFilesById.get(fileId))
		.filter((file): file is (typeof currentProcessStep.files)[number] => Boolean(file));

	if (removedFiles.length !== removedFileIds.length) {
		throw new AppError(400, PROCESS_STEP_FILE_NOT_FOUND_ERROR);
	}

	const remainingFiles = currentProcessStep.files.filter((file) => !removedFileIds.includes(file.id));
	assertProcessStepFilesLimits(remainingFiles, files);

	const savedFiles = await saveProcessStepFiles(files);

	try {
		const processStep = await prisma.processStep.update({
			where: { id },
			data: {
				...(data.name !== undefined ? { name: data.name } : {}),
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
			select: processStepSelect,
		});

		if (removedFiles.length) {
			const removedAbsolutePaths = removedFiles
				.map((file) => getProcessStepFileAbsolutePath(file.storagePath))
				.filter((absolutePath): absolutePath is string => Boolean(absolutePath));
			await cleanupStoredFiles(removedAbsolutePaths);
		}

		return {
			...processStep,
			files: mapProcessStepFiles(processStep.files),
		};
	} catch (error) {
		await cleanupStoredFiles(savedFiles.map((file) => file.absolutePath));
		throw error;
	}
};

export const updateProcessSteps = async (
	processOperationId: number,
	data: UpdateProcessStepsPayload,
	filesByClientId: ProcessStepFilesByClientId,
	actorId: number,
) => {
	const processOperation = await ensureProcessOperationExists(processOperationId);
	const permissions = await getProcessStepPermissions(actorId);
	assertCanEditProcessSteps(permissions, processOperation.process, actorId);

	const clientIds = data.items.map((item) => item.clientId);
	if (new Set(clientIds).size !== clientIds.length) {
		throw new AppError(400, "Некорректный список этапов");
	}

	const currentSteps = await prisma.processStep.findMany({
		where: { processOperationId },
		select: {
			id: true,
			files: {
				select: processStepFileSelect,
				orderBy: {
					id: "asc",
				},
			},
		},
	});
	const currentStepsById = new Map(currentSteps.map((step) => [step.id, step]));
	const itemIds = getUniqueIds(data.items
		.map((item) => item.id)
		.filter((id): id is number => typeof id === "number"));

	if (itemIds.some((id) => !currentStepsById.has(id))) {
		throw new AppError(404, PROCESS_STEP_NOT_FOUND_ERROR);
	}

	const nextStepIds = new Set(itemIds);
	const removedSteps = currentSteps.filter((step) => !nextStepIds.has(step.id));
	const savedFilesByClientId = new Map<string, Awaited<ReturnType<typeof saveProcessStepFiles>>>();
	const allSavedAbsolutePaths: string[] = [];

	try {
		for (const item of data.items) {
			const incomingFiles = filesByClientId.get(item.clientId) ?? [];
			const currentStep = item.id ? currentStepsById.get(item.id) : null;
			const removedFileIds = getUniqueIds(item.removedFileIds ?? []);
			const currentFilesById = new Map((currentStep?.files ?? []).map((file) => [file.id, file]));
			const removedFiles = removedFileIds
				.map((fileId) => currentFilesById.get(fileId))
				.filter((file): file is (typeof currentSteps)[number]["files"][number] => Boolean(file));

			if (removedFiles.length !== removedFileIds.length) {
				throw new AppError(400, PROCESS_STEP_FILE_NOT_FOUND_ERROR);
			}

			const remainingFiles = (currentStep?.files ?? []).filter((file) => !removedFileIds.includes(file.id));
			assertProcessStepFilesLimits(remainingFiles, incomingFiles);

			const savedFiles = await saveProcessStepFiles(incomingFiles);
			savedFilesByClientId.set(item.clientId, savedFiles);
			allSavedAbsolutePaths.push(...savedFiles.map((file) => file.absolutePath));
		}

		await prisma.$transaction(async (tx) => {
			if (removedSteps.length) {
				await tx.processStep.deleteMany({
					where: {
						id: {
							in: removedSteps.map((step) => step.id),
						},
					},
				});
			}

			for (const [sortOrder, item] of data.items.entries()) {
				const savedFiles = savedFilesByClientId.get(item.clientId) ?? [];
				const removedFileIds = getUniqueIds(item.removedFileIds ?? []);
				const fileUpdate = removedFileIds.length || savedFiles.length
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
					: {};

				if (item.id) {
					await tx.processStep.update({
						where: { id: item.id },
						data: {
							name: item.name,
							description: item.description,
							sortOrder,
							...fileUpdate,
						},
					});
				} else {
					await tx.processStep.create({
						data: {
							processOperationId,
							name: item.name,
							description: item.description,
							sortOrder,
							...fileUpdate,
						},
					});
				}
			}
		});

		const removedAbsolutePaths = [
			...removedSteps.flatMap((step) => step.files),
			...data.items.flatMap((item) => {
				const currentStep = item.id ? currentStepsById.get(item.id) : null;
				const removedFileIds = getUniqueIds(item.removedFileIds ?? []);
				return (currentStep?.files ?? []).filter((file) => removedFileIds.includes(file.id));
			}),
		]
			.map((file) => getProcessStepFileAbsolutePath(file.storagePath))
			.filter((absolutePath): absolutePath is string => Boolean(absolutePath));

		await cleanupStoredFiles(removedAbsolutePaths);
		return listProcessSteps({ operationId: processOperationId });
	} catch (error) {
		await cleanupStoredFiles(allSavedAbsolutePaths);
		throw error;
	}
};

export const getProcessStepFileDownloadInfo = async (fileId: number) => {
	const processStepFile = await prisma.processStepFile.findUnique({
		where: { id: fileId },
		select: processStepFileDownloadSelect,
	});

	if (!processStepFile) {
		throw new AppError(404, PROCESS_STEP_FILE_NOT_FOUND_ERROR);
	}

	return {
		...processStepFile,
		originalName: normalizeProcessStepFileOriginalName(processStepFile.originalName),
	};
};

export const getProcessStepFilesArchiveInfo = async (processStepId: number) => {
	const processStep = await prisma.processStep.findUnique({
		where: { id: processStepId },
		select: processStepArchiveSelect,
	});

	if (!processStep) {
		throw new AppError(404, PROCESS_STEP_NOT_FOUND_ERROR);
	}

	return {
		...processStep,
		files: processStep.files.map((file) => ({
			...file,
			originalName: normalizeProcessStepFileOriginalName(file.originalName),
		})),
	};
};
