import { access } from "node:fs/promises";
import type { NextFunction, Request, Response } from "express";
import { Router } from "express";
import archiver from "archiver";
import multer from "multer";
import { AppError } from "../../shared/errors/app-error.js";
import { asyncHandler } from "../../shared/http/async-handler.js";
import { requireAuth } from "../../shared/http/auth.js";
import {
	assertPermission,
	hasPermission,
	loadRolePermissions,
	requirePermission,
} from "../../shared/http/permissions.js";
import { validate } from "../../shared/http/validate.js";
import {
	OPERATION_FILES_LIMIT,
	OPERATION_FILE_SIZE_LIMIT,
	assertOperationFilesTotalSize,
	getOperationFileAbsolutePath,
} from "../../shared/storage/operations.js";
import {
	WORK_FILES_LIMIT,
	WORK_FILE_SIZE_LIMIT,
	assertWorkFilesTotalSize,
	getWorkFileAbsolutePath,
} from "../../shared/storage/works.js";
import {
	createBlankSchema,
	createMaterialGroupSchema,
	createMaterialSchema,
	createOperationSchema,
	createOperationGroupSchema,
	createWorkSchema,
	createWorkGroupSchema,
	createTypeProductSchema,
	deleteBlankIdsSchema,
	deleteMaterialGroupIdsSchema,
	deleteMaterialIdsSchema,
	deleteOperationIdsSchema,
	deleteOperationGroupIdsSchema,
	deleteWorkIdsSchema,
	deleteWorkGroupIdsSchema,
	deleteTypeProductIdsSchema,
	getBlanksTableSchema,
	getMaterialGroupsSchema,
	getMaterialGroupsTableSchema,
	getMaterialsSchema,
	getMaterialsTableSchema,
	getOperationsSchema,
	getOperationsTableSchema,
	getOperationGroupsSchema,
	getOperationGroupsTableSchema,
	getTypeProductsSchema,
	getWorksTableSchema,
	getWorkGroupsSchema,
	getWorkGroupsTableSchema,
	getTypeProductsTableSchema,
	updateBlankSchema,
	updateBlanksTableSchema,
	updateMaterialGroupSchema,
	updateMaterialGroupsTableSchema,
	updateMaterialSchema,
	updateMaterialsTableSchema,
	updateOperationSchema,
	updateOperationsTableSchema,
	updateOperationGroupSchema,
	updateOperationGroupsTableSchema,
	updateWorkSchema,
	updateWorksTableSchema,
	updateWorkGroupSchema,
	updateWorkGroupsTableSchema,
	updateTypeProductSchema,
	updateTypeProductsTableSchema,
} from "./guide.schemas.js";
import {
	createBlank,
	createMaterial,
	createMaterialGroup,
	createOperation,
	createOperationGroup,
	createWork,
	createWorkGroup,
	createTypeProduct,
	deleteBlanks,
	deleteMaterialGroups,
	deleteMaterials,
	deleteOperations,
	deleteOperationGroups,
	deleteWorks,
	deleteWorkGroups,
	deleteTypeProducts,
	getBlankById,
	getBlanksTable,
	getMaterialById,
	getMaterialGroupById,
	getMaterialGroupsTable,
	getMaterialsTable,
	getOperationById,
	getOperationFileDownloadInfo,
	getOperationFilesArchiveInfo,
	getOperationsTable,
	getOperationGroupById,
	getOperationGroupsTable,
	getWorkById,
	getWorkFileDownloadInfo,
	getWorkFilesArchiveInfo,
	getWorksTable,
	getWorkGroupById,
	getWorkGroupsTable,
	getTypeProductById,
	getTypeProductsTable,
	listMaterials,
	listOperations,
	listMaterialGroups,
	listOperationGroups,
	listTypeProducts,
	listWorkGroups,
	updateBlank,
	updateBlanksTable,
	updateMaterial,
	updateMaterialGroup,
	updateMaterialGroupsTable,
	updateMaterialsTable,
	updateOperation,
	updateOperationsTable,
	updateOperationGroup,
	updateOperationGroupsTable,
	updateWork,
	updateWorksTable,
	updateWorkGroup,
	updateWorkGroupsTable,
	updateTypeProduct,
	updateTypeProductsTable,
} from "./guide.service.js";

const parseId = (value: string) => {
	const id = Number.parseInt(value, 10);

	if (!Number.isInteger(id) || id <= 0) {
		throw new AppError(400, `Некорректный id`);
	}

	return id;
};

export const guideRouter = Router();

const OPERATION_FILE_NOT_FOUND_ERROR = "Файл операции не найден";
const OPERATION_ARCHIVE_EMPTY_ERROR = "У операции нет загруженных файлов";
const OPERATION_ARCHIVE_NAME_FALLBACK = "operation-files";
const OPERATION_ARCHIVE_ENTRY_FALLBACK = "file";
const WORK_FILE_NOT_FOUND_ERROR = "Файл работы не найден";
const WORK_ARCHIVE_EMPTY_ERROR = "У работы нет загруженных файлов";
const WORK_ARCHIVE_NAME_FALLBACK = "work-files";

const PRODUCTS_FOR_SELECT_PERMISSIONS = [
	"view",
	"adding",
	"editing",
	"viewProcess",
	"addingProcess",
	"editingProcess",
] as const;

const canReadGuideListForSelect = (permissions: Awaited<ReturnType<typeof loadRolePermissions>>) =>
	hasPermission(permissions, "/guide", "view")
	|| PRODUCTS_FOR_SELECT_PERMISSIONS.some((permission) => hasPermission(permissions, "/products", permission));

const requireGuideListPermission = async (request: Request, response: Response, next: NextFunction) => {
	try {
		const permissions = await loadRolePermissions(request, response);
		const forSelect = request.query.forSelect === "true";

		if (forSelect) {
			if (!canReadGuideListForSelect(permissions)) {
				throw new AppError(403, "У вас отсутствует доступ для данного действия");
			}
		} else {
			assertPermission(permissions, "/guide", "view");
		}

		next();
	} catch (error) {
		next(error);
	}
};

const sanitizeArchiveEntryName = (value: string, fallback: string) => {
	const sanitized = value
		.trim()
		.replace(/[<>:"/\\|?*\u0000-\u001F]/g, "_")
		.replace(/\.+$/g, "")
		.replace(/\s+/g, " ")
		.slice(0, 120);

	return sanitized || fallback;
};

const getUniqueArchiveEntryName = (fileName: string, usedNames: Set<string>) => {
	const sanitizedFileName = sanitizeArchiveEntryName(fileName, OPERATION_ARCHIVE_ENTRY_FALLBACK);
	const dotIndex = sanitizedFileName.lastIndexOf(".");
	const hasExtension = dotIndex > 0;
	const baseName = hasExtension ? sanitizedFileName.slice(0, dotIndex) : sanitizedFileName;
	const extension = hasExtension ? sanitizedFileName.slice(dotIndex) : "";
	let candidate = sanitizedFileName;
	let suffix = 1;

	while (usedNames.has(candidate)) {
		candidate = `${baseName} (${suffix})${extension}`;
		suffix += 1;
	}

	usedNames.add(candidate);

	return candidate;
};

const ensureOperationArchiveFilesExist = async (absolutePaths: string[]) => {
	for (const absolutePath of absolutePaths) {
		try {
			await access(absolutePath);
		} catch (error) {
			if (typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT") {
				throw new AppError(404, OPERATION_FILE_NOT_FOUND_ERROR);
			}

			throw error;
		}
	}
};

const operationUpload = multer({
	storage: multer.memoryStorage(),
	defParamCharset: "utf8",
	limits: {
		fileSize: OPERATION_FILE_SIZE_LIMIT,
		files: OPERATION_FILES_LIMIT,
	},
});

const workUpload = multer({
	storage: multer.memoryStorage(),
	defParamCharset: "utf8",
	limits: {
		fileSize: WORK_FILE_SIZE_LIMIT,
		files: WORK_FILES_LIMIT,
	},
});

const parseOperationUpload = (request: Request, response: Response, next: NextFunction) => {
	operationUpload.array("files", OPERATION_FILES_LIMIT)(request, response, (error) => {
		if (!error) {
			try {
				const files = Array.isArray(request.files) ? request.files : [];
				assertOperationFilesTotalSize(files);
				next();
			} catch (uploadError) {
				next(uploadError);
			}
			return;
		}

		if (error instanceof multer.MulterError) {
			if (error.code === "LIMIT_FILE_SIZE") {
				next(new AppError(413, "Размер файла не должен превышать 100 MB"));
				return;
			}

			if (error.code === "LIMIT_FILE_COUNT") {
				next(new AppError(400, "Можно загрузить не более 20 файлов"));
				return;
			}

			next(new AppError(400, "Не удалось загрузить файлы операции"));
			return;
		}

		next(error);
	});
};

const parseWorkUpload = (request: Request, response: Response, next: NextFunction) => {
	workUpload.array("files", WORK_FILES_LIMIT)(request, response, (error) => {
		if (!error) {
			try {
				const files = Array.isArray(request.files) ? request.files : [];
				assertWorkFilesTotalSize(files);
				next();
			} catch (uploadError) {
				next(uploadError);
			}
			return;
		}

		if (error instanceof multer.MulterError) {
			if (error.code === "LIMIT_FILE_SIZE") {
				next(new AppError(413, "Размер файла не должен превышать 20 MB"));
				return;
			}

			if (error.code === "LIMIT_FILE_COUNT") {
				next(new AppError(400, "Можно загрузить не более 10 файлов"));
				return;
			}

			next(new AppError(400, "Не удалось загрузить файлы работы"));
			return;
		}

		next(error);
	});
};

guideRouter.get(
	"/typeProducts",
	requireGuideListPermission,
	asyncHandler(async (request, response) => {
		const query = validate(getTypeProductsSchema, request.query);
		const typeProducts = await listTypeProducts(query);

		response.json(typeProducts);
	}),
);

guideRouter.get(
	"/typeProducts/table",
	requirePermission("/guide", "view"),
	asyncHandler(async (request, response) => {
		const query = validate(getTypeProductsTableSchema, request.query);
		const table = await getTypeProductsTable(query);

		response.json(table);
	}),
);

guideRouter.get(
	"/typeProducts/:id",
	requirePermission("/guide", "view"),
	asyncHandler(async (request, response) => {
		const typeProduct = await getTypeProductById(parseId(String(request.params.id)));

		response.json(typeProduct);
	}),
);

guideRouter.post(
	"/typeProducts",
	requirePermission("/guide", "adding"),
	asyncHandler(async (request, response) => {
		const payload = validate(createTypeProductSchema, request.body ?? {});
		const typeProduct = await createTypeProduct(payload);

		response.status(201).json(typeProduct);
	}),
);

guideRouter.patch(
	"/typeProducts/table",
	requirePermission("/guide", "view"),
	asyncHandler(async (request, response) => {
		const auth = requireAuth(request, response);
		const payload = validate(updateTypeProductsTableSchema, request.body ?? {});
		const result = await updateTypeProductsTable(payload, auth.userId);

		response.json(result);
	}),
);

guideRouter.patch(
	"/typeProducts/:id",
	requirePermission("/guide", "editing"),
	asyncHandler(async (request, response) => {
		const payload = validate(updateTypeProductSchema, request.body ?? {});
		const typeProduct = await updateTypeProduct(parseId(String(request.params.id)), payload);

		response.json(typeProduct);
	}),
);

guideRouter.delete(
	"/typeProducts",
	requirePermission("/guide", "view"),
	asyncHandler(async (request, response) => {
		const auth = requireAuth(request, response);
		const payload = validate(deleteTypeProductIdsSchema, request.body ?? []);
		const result = await deleteTypeProducts(payload, auth.userId);

		response.json(result);
	}),
);

guideRouter.get(
	"/materialGroup/table",
	requirePermission("/guide", "view"),
	asyncHandler(async (request, response) => {
		const query = validate(getMaterialGroupsTableSchema, request.query);
		const table = await getMaterialGroupsTable(query);

		response.json(table);
	}),
);

guideRouter.get(
	"/materialGroup",
	requireGuideListPermission,
	asyncHandler(async (request, response) => {
		const query = validate(getMaterialGroupsSchema, request.query);
		const materialGroups = await listMaterialGroups(query);

		response.json(materialGroups);
	}),
);

guideRouter.get(
	"/materialGroup/:id",
	requirePermission("/guide", "view"),
	asyncHandler(async (request, response) => {
		const materialGroup = await getMaterialGroupById(parseId(String(request.params.id)));

		response.json(materialGroup);
	}),
);

guideRouter.post(
	"/materialGroup",
	requirePermission("/guide", "adding"),
	asyncHandler(async (request, response) => {
		const payload = validate(createMaterialGroupSchema, request.body ?? {});
		const materialGroup = await createMaterialGroup(payload);

		response.status(201).json(materialGroup);
	}),
);

guideRouter.patch(
	"/materialGroup/table",
	requirePermission("/guide", "view"),
	asyncHandler(async (request, response) => {
		const auth = requireAuth(request, response);
		const payload = validate(updateMaterialGroupsTableSchema, request.body ?? {});
		const result = await updateMaterialGroupsTable(payload, auth.userId);

		response.json(result);
	}),
);

guideRouter.patch(
	"/materialGroup/:id",
	requirePermission("/guide", "editing"),
	asyncHandler(async (request, response) => {
		const payload = validate(updateMaterialGroupSchema, request.body ?? {});
		const materialGroup = await updateMaterialGroup(parseId(String(request.params.id)), payload);

		response.json(materialGroup);
	}),
);

guideRouter.delete(
	"/materialGroup",
	requirePermission("/guide", "view"),
	asyncHandler(async (request, response) => {
		const auth = requireAuth(request, response);
		const payload = validate(deleteMaterialGroupIdsSchema, request.body ?? []);
		const result = await deleteMaterialGroups(payload, auth.userId);

		response.json(result);
	}),
);

guideRouter.get(
	"/operationGroup/table",
	requirePermission("/guide", "view"),
	asyncHandler(async (request, response) => {
		const query = validate(getOperationGroupsTableSchema, request.query);
		const table = await getOperationGroupsTable(query);

		response.json(table);
	}),
);

guideRouter.get(
	"/operationGroup",
	requireGuideListPermission,
	asyncHandler(async (request, response) => {
		const query = validate(getOperationGroupsSchema, request.query);
		const operationGroups = await listOperationGroups(query);

		response.json(operationGroups);
	}),
);

guideRouter.get(
	"/operationGroup/:id",
	requirePermission("/guide", "view"),
	asyncHandler(async (request, response) => {
		const operationGroup = await getOperationGroupById(parseId(String(request.params.id)));

		response.json(operationGroup);
	}),
);

guideRouter.post(
	"/operationGroup",
	requirePermission("/guide", "adding"),
	asyncHandler(async (request, response) => {
		const payload = validate(createOperationGroupSchema, request.body ?? {});
		const operationGroup = await createOperationGroup(payload);

		response.status(201).json(operationGroup);
	}),
);

guideRouter.patch(
	"/operationGroup/table",
	requirePermission("/guide", "view"),
	asyncHandler(async (request, response) => {
		const auth = requireAuth(request, response);
		const payload = validate(updateOperationGroupsTableSchema, request.body ?? {});
		const result = await updateOperationGroupsTable(payload, auth.userId);

		response.json(result);
	}),
);

guideRouter.patch(
	"/operationGroup/:id",
	requirePermission("/guide", "editing"),
	asyncHandler(async (request, response) => {
		const payload = validate(updateOperationGroupSchema, request.body ?? {});
		const operationGroup = await updateOperationGroup(parseId(String(request.params.id)), payload);

		response.json(operationGroup);
	}),
);

guideRouter.delete(
	"/operationGroup",
	requirePermission("/guide", "view"),
	asyncHandler(async (request, response) => {
		const auth = requireAuth(request, response);
		const payload = validate(deleteOperationGroupIdsSchema, request.body ?? []);
		const result = await deleteOperationGroups(payload, auth.userId);

		response.json(result);
	}),
);

guideRouter.get(
	"/material/table",
	requirePermission("/guide", "view"),
	asyncHandler(async (request, response) => {
		const query = validate(getMaterialsTableSchema, request.query);
		const table = await getMaterialsTable(query);

		response.json(table);
	}),
);

guideRouter.get(
	"/material",
	requireGuideListPermission,
	asyncHandler(async (request, response) => {
		const query = validate(getMaterialsSchema, request.query);
		const materials = await listMaterials(query);

		response.json(materials);
	}),
);

guideRouter.get(
	"/material/:id",
	requirePermission("/guide", "view"),
	asyncHandler(async (request, response) => {
		const material = await getMaterialById(parseId(String(request.params.id)));

		response.json(material);
	}),
);

guideRouter.post(
	"/material",
	requirePermission("/guide", "adding"),
	asyncHandler(async (request, response) => {
		const payload = validate(createMaterialSchema, request.body ?? {});
		const material = await createMaterial(payload);

		response.status(201).json(material);
	}),
);

guideRouter.patch(
	"/material/table",
	requirePermission("/guide", "view"),
	asyncHandler(async (request, response) => {
		const auth = requireAuth(request, response);
		const payload = validate(updateMaterialsTableSchema, request.body ?? {});
		const result = await updateMaterialsTable(payload, auth.userId);

		response.json(result);
	}),
);

guideRouter.patch(
	"/material/:id",
	requirePermission("/guide", "editing"),
	asyncHandler(async (request, response) => {
		const payload = validate(updateMaterialSchema, request.body ?? {});
		const material = await updateMaterial(parseId(String(request.params.id)), payload);

		response.json(material);
	}),
);

guideRouter.delete(
	"/material",
	requirePermission("/guide", "view"),
	asyncHandler(async (request, response) => {
		const auth = requireAuth(request, response);
		const payload = validate(deleteMaterialIdsSchema, request.body ?? []);
		const result = await deleteMaterials(payload, auth.userId);

		response.json(result);
	}),
);

guideRouter.get(
	"/blank/table",
	requirePermission("/guide", "view"),
	asyncHandler(async (request, response) => {
		const query = validate(getBlanksTableSchema, request.query);
		const table = await getBlanksTable(query);

		response.json(table);
	}),
);

guideRouter.get(
	"/blank/:id",
	requirePermission("/guide", "view"),
	asyncHandler(async (request, response) => {
		const blank = await getBlankById(parseId(String(request.params.id)));

		response.json(blank);
	}),
);

guideRouter.post(
	"/blank",
	requirePermission("/guide", "adding"),
	asyncHandler(async (request, response) => {
		const payload = validate(createBlankSchema, request.body ?? {});
		const blank = await createBlank(payload);

		response.status(201).json(blank);
	}),
);

guideRouter.patch(
	"/blank/table",
	requirePermission("/guide", "view"),
	asyncHandler(async (request, response) => {
		const auth = requireAuth(request, response);
		const payload = validate(updateBlanksTableSchema, request.body ?? {});
		const result = await updateBlanksTable(payload, auth.userId);

		response.json(result);
	}),
);

guideRouter.patch(
	"/blank/:id",
	requirePermission("/guide", "editing"),
	asyncHandler(async (request, response) => {
		const payload = validate(updateBlankSchema, request.body ?? {});
		const blank = await updateBlank(parseId(String(request.params.id)), payload);

		response.json(blank);
	}),
);

guideRouter.delete(
	"/blank",
	requirePermission("/guide", "view"),
	asyncHandler(async (request, response) => {
		const auth = requireAuth(request, response);
		const payload = validate(deleteBlankIdsSchema, request.body ?? []);
		const result = await deleteBlanks(payload, auth.userId);

		response.json(result);
	}),
);

guideRouter.get(
	"/workGroup/table",
	requirePermission("/guide", "view"),
	asyncHandler(async (request, response) => {
		const query = validate(getWorkGroupsTableSchema, request.query);
		const table = await getWorkGroupsTable(query);

		response.json(table);
	}),
);

guideRouter.get(
	"/workGroup",
	requireGuideListPermission,
	asyncHandler(async (request, response) => {
		const query = validate(getWorkGroupsSchema, request.query);
		const workGroups = await listWorkGroups(query);

		response.json(workGroups);
	}),
);

guideRouter.get(
	"/workGroup/:id",
	requirePermission("/guide", "view"),
	asyncHandler(async (request, response) => {
		const workGroup = await getWorkGroupById(parseId(String(request.params.id)));

		response.json(workGroup);
	}),
);

guideRouter.post(
	"/workGroup",
	requirePermission("/guide", "adding"),
	asyncHandler(async (request, response) => {
		const payload = validate(createWorkGroupSchema, request.body ?? {});
		const workGroup = await createWorkGroup(payload);

		response.status(201).json(workGroup);
	}),
);

guideRouter.patch(
	"/workGroup/table",
	requirePermission("/guide", "view"),
	asyncHandler(async (request, response) => {
		const auth = requireAuth(request, response);
		const payload = validate(updateWorkGroupsTableSchema, request.body ?? {});
		const result = await updateWorkGroupsTable(payload, auth.userId);

		response.json(result);
	}),
);

guideRouter.patch(
	"/workGroup/:id",
	requirePermission("/guide", "editing"),
	asyncHandler(async (request, response) => {
		const payload = validate(updateWorkGroupSchema, request.body ?? {});
		const workGroup = await updateWorkGroup(parseId(String(request.params.id)), payload);

		response.json(workGroup);
	}),
);

guideRouter.delete(
	"/workGroup",
	requirePermission("/guide", "view"),
	asyncHandler(async (request, response) => {
		const auth = requireAuth(request, response);
		const payload = validate(deleteWorkGroupIdsSchema, request.body ?? []);
		const result = await deleteWorkGroups(payload, auth.userId);

		response.json(result);
	}),
);

guideRouter.get(
	"/operation/table",
	requirePermission("/guide", "view"),
	asyncHandler(async (request, response) => {
		const query = validate(getOperationsTableSchema, request.query);
		const table = await getOperationsTable(query);

		response.json(table);
	}),
);

guideRouter.get(
	"/operation",
	requireGuideListPermission,
	asyncHandler(async (request, response) => {
		const query = validate(getOperationsSchema, request.query);
		const operations = await listOperations(query);

		response.json(operations);
	}),
);

guideRouter.get(
	"/operation/files/:fileId/download",
	requirePermission("/guide", "view"),
	asyncHandler(async (request, response, next) => {
		const operationFile = await getOperationFileDownloadInfo(parseId(String(request.params.fileId)));
		const absolutePath = getOperationFileAbsolutePath(operationFile.storagePath);

		if (!absolutePath) {
			throw new AppError(500, "Не удалось получить путь к файлу операции");
		}

		response.download(absolutePath, operationFile.originalName, (error) => {
			if (error && !response.headersSent) {
				if (typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT") {
					next(new AppError(404, "Файл операции не найден"));
					return;
				}

				next(error);
			}
		});
	}),
);

guideRouter.get(
	"/operation/:id/files/archive",
	requirePermission("/guide", "view"),
	asyncHandler(async (request, response, next) => {
		const operation = await getOperationFilesArchiveInfo(parseId(String(request.params.id)));

		if (!operation.files.length) {
			throw new AppError(404, OPERATION_ARCHIVE_EMPTY_ERROR);
		}

		const archiveFiles = operation.files.map((file) => {
			const absolutePath = getOperationFileAbsolutePath(file.storagePath);

			if (!absolutePath) {
				throw new AppError(500, "Не удалось получить путь к файлу операции");
			}

			return {
				absolutePath,
				originalName: file.originalName,
			};
		});

		await ensureOperationArchiveFilesExist(archiveFiles.map((file) => file.absolutePath));

		const archive = archiver("zip", {
			zlib: {
				level: 9,
			},
		});
		const archiveName = `${sanitizeArchiveEntryName(operation.name, OPERATION_ARCHIVE_NAME_FALLBACK)}.zip`;
		const usedNames = new Set<string>();

		response.attachment(archiveName);

		archive.on("warning", (error: Error & { code?: string }) => {
			if (error.code === "ENOENT") {
				if (!response.headersSent) {
					next(new AppError(404, OPERATION_FILE_NOT_FOUND_ERROR));
					return;
				}

				response.destroy(error as Error);
				return;
			}

			if (!response.headersSent) {
				next(error);
				return;
			}

			response.destroy(error as Error);
		});

		archive.on("error", (error: Error) => {
			if (!response.headersSent) {
				next(error);
				return;
			}

			response.destroy(error);
		});

		response.on("close", () => {
			if (!response.writableEnded) {
				archive.abort();
			}
		});

		archive.pipe(response);

		for (const file of archiveFiles) {
			archive.file(file.absolutePath, {
				name: getUniqueArchiveEntryName(file.originalName, usedNames),
			});
		}

		void archive.finalize();
	}),
);

guideRouter.get(
	"/operation/:id",
	requirePermission("/guide", "view"),
	asyncHandler(async (request, response) => {
		const operation = await getOperationById(parseId(String(request.params.id)));

		response.json(operation);
	}),
);

guideRouter.post(
	"/operation",
	requirePermission("/guide", "adding"),
	parseOperationUpload,
	asyncHandler(async (request, response) => {
		const payload = validate(createOperationSchema, request.body ?? {});
		const files = Array.isArray(request.files) ? request.files : [];
		const operation = await createOperation(payload, files);

		response.status(201).json(operation);
	}),
);

guideRouter.patch(
	"/operation/table",
	requirePermission("/guide", "view"),
	asyncHandler(async (request, response) => {
		const auth = requireAuth(request, response);
		const payload = validate(updateOperationsTableSchema, request.body ?? {});
		const result = await updateOperationsTable(payload, auth.userId);

		response.json(result);
	}),
);

guideRouter.patch(
	"/operation/:id",
	requirePermission("/guide", "editing"),
	parseOperationUpload,
	asyncHandler(async (request, response) => {
		const payload = validate(updateOperationSchema, request.body ?? {});
		const files = Array.isArray(request.files) ? request.files : [];

		if (Object.keys(payload).length === 0 && files.length === 0) {
			throw new AppError(400, "Нужно передать хотя бы одно поле для обновления");
		}

		const operation = await updateOperation(parseId(String(request.params.id)), payload, files);

		response.json(operation);
	}),
);

guideRouter.delete(
	"/operation",
	requirePermission("/guide", "view"),
	asyncHandler(async (request, response) => {
		const auth = requireAuth(request, response);
		const payload = validate(deleteOperationIdsSchema, request.body ?? []);
		const result = await deleteOperations(payload, auth.userId);

		response.json(result);
	}),
);

guideRouter.get(
	"/work/table",
	requirePermission("/guide", "view"),
	asyncHandler(async (request, response) => {
		const query = validate(getWorksTableSchema, request.query);
		const table = await getWorksTable(query);

		response.json(table);
	}),
);

guideRouter.get(
	"/work/files/:fileId/download",
	requirePermission("/guide", "view"),
	asyncHandler(async (request, response, next) => {
		const workFile = await getWorkFileDownloadInfo(parseId(String(request.params.fileId)));
		const absolutePath = getWorkFileAbsolutePath(workFile.storagePath);

		if (!absolutePath) {
			throw new AppError(500, "Не удалось получить путь к файлу работы");
		}

		response.download(absolutePath, workFile.originalName, (error) => {
			if (error && !response.headersSent) {
				if (typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT") {
					next(new AppError(404, WORK_FILE_NOT_FOUND_ERROR));
					return;
				}

				next(error);
			}
		});
	}),
);

guideRouter.get(
	"/work/:id/files/archive",
	requirePermission("/guide", "view"),
	asyncHandler(async (request, response, next) => {
		const work = await getWorkFilesArchiveInfo(parseId(String(request.params.id)));

		if (!work.files.length) {
			throw new AppError(404, WORK_ARCHIVE_EMPTY_ERROR);
		}

		const archiveFiles = work.files.map((file) => {
			const absolutePath = getWorkFileAbsolutePath(file.storagePath);

			if (!absolutePath) {
				throw new AppError(500, "Не удалось получить путь к файлу работы");
			}

			return {
				absolutePath,
				originalName: file.originalName,
			};
		});

		await ensureOperationArchiveFilesExist(archiveFiles.map((file) => file.absolutePath));

		const archive = archiver("zip", {
			zlib: {
				level: 9,
			},
		});
		const archiveName = `${sanitizeArchiveEntryName(work.name, WORK_ARCHIVE_NAME_FALLBACK)}.zip`;
		const usedNames = new Set<string>();

		response.attachment(archiveName);

		archive.on("warning", (error: Error & { code?: string }) => {
			if (error.code === "ENOENT") {
				if (!response.headersSent) {
					next(new AppError(404, WORK_FILE_NOT_FOUND_ERROR));
					return;
				}

				response.destroy(error as Error);
				return;
			}

			if (!response.headersSent) {
				next(error);
				return;
			}

			response.destroy(error as Error);
		});

		archive.on("error", (error: Error) => {
			if (!response.headersSent) {
				next(error);
				return;
			}

			response.destroy(error);
		});

		response.on("close", () => {
			if (!response.writableEnded) {
				archive.abort();
			}
		});

		archive.pipe(response);

		for (const file of archiveFiles) {
			archive.file(file.absolutePath, {
				name: getUniqueArchiveEntryName(file.originalName, usedNames),
			});
		}

		void archive.finalize();
	}),
);

guideRouter.get(
	"/work/:id",
	requirePermission("/guide", "view"),
	asyncHandler(async (request, response) => {
		const work = await getWorkById(parseId(String(request.params.id)));

		response.json(work);
	}),
);

guideRouter.post(
	"/work",
	requirePermission("/guide", "adding"),
	parseWorkUpload,
	asyncHandler(async (request, response) => {
		const payload = validate(createWorkSchema, request.body ?? {});
		const files = Array.isArray(request.files) ? request.files : [];
		const work = await createWork(payload, files);

		response.status(201).json(work);
	}),
);

guideRouter.patch(
	"/work/table",
	requirePermission("/guide", "view"),
	asyncHandler(async (request, response) => {
		const auth = requireAuth(request, response);
		const payload = validate(updateWorksTableSchema, request.body ?? {});
		const result = await updateWorksTable(payload, auth.userId);

		response.json(result);
	}),
);

guideRouter.patch(
	"/work/:id",
	requirePermission("/guide", "editing"),
	parseWorkUpload,
	asyncHandler(async (request, response) => {
		const payload = validate(updateWorkSchema, request.body ?? {});
		const files = Array.isArray(request.files) ? request.files : [];

		if (Object.keys(payload).length === 0 && files.length === 0) {
			throw new AppError(400, "Нужно передать хотя бы одно поле для обновления");
		}

		const work = await updateWork(parseId(String(request.params.id)), payload, files);

		response.json(work);
	}),
);

guideRouter.delete(
	"/work",
	requirePermission("/guide", "view"),
	asyncHandler(async (request, response) => {
		const auth = requireAuth(request, response);
		const payload = validate(deleteWorkIdsSchema, request.body ?? []);
		const result = await deleteWorks(payload, auth.userId);

		response.json(result);
	}),
);
