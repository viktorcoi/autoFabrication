import { access } from "node:fs/promises";
import type { NextFunction, Request, Response } from "express";
import { Router } from "express";
import archiver from "archiver";
import multer from "multer";
import { AppError } from "../../shared/errors/app-error.js";
import { asyncHandler } from "../../shared/http/async-handler.js";
import { requireAuth } from "../../shared/http/auth.js";
import { requirePermission } from "../../shared/http/permissions.js";
import { validate } from "../../shared/http/validate.js";
import {
	OPERATION_FILES_LIMIT,
	OPERATION_FILE_SIZE_LIMIT,
	assertOperationFilesTotalSize,
	getOperationFileAbsolutePath,
} from "../../shared/storage/operations.js";
import {
	createMaterialGroupSchema,
	createMaterialSchema,
	createOperationSchema,
	createOperationGroupSchema,
	createTypeProductSchema,
	deleteMaterialGroupIdsSchema,
	deleteMaterialIdsSchema,
	deleteOperationIdsSchema,
	deleteOperationGroupIdsSchema,
	deleteTypeProductIdsSchema,
	getMaterialGroupsTableSchema,
	getMaterialsTableSchema,
	getOperationsTableSchema,
	getOperationGroupsTableSchema,
	getTypeProductsTableSchema,
	updateMaterialGroupSchema,
	updateMaterialGroupsTableSchema,
	updateMaterialSchema,
	updateMaterialsTableSchema,
	updateOperationSchema,
	updateOperationsTableSchema,
	updateOperationGroupSchema,
	updateOperationGroupsTableSchema,
	updateTypeProductSchema,
	updateTypeProductsTableSchema,
} from "./guide.schemas.js";
import {
	createMaterial,
	createMaterialGroup,
	createOperation,
	createOperationGroup,
	createTypeProduct,
	deleteMaterialGroups,
	deleteMaterials,
	deleteOperations,
	deleteOperationGroups,
	deleteTypeProducts,
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
	getTypeProductById,
	getTypeProductsTable,
	listMaterialGroups,
	listOperationGroups,
	updateMaterial,
	updateMaterialGroup,
	updateMaterialGroupsTable,
	updateMaterialsTable,
	updateOperation,
	updateOperationsTable,
	updateOperationGroup,
	updateOperationGroupsTable,
	updateTypeProduct,
	updateTypeProductsTable,
} from "./guide.service.js";

const parseId = (value: string, entityName: string) => {
	const id = Number.parseInt(value, 10);

	if (!Number.isInteger(id) || id <= 0) {
		throw new AppError(400, `Некорректный id ${entityName}`);
	}

	return id;
};

export const guideRouter = Router();

const OPERATION_FILE_NOT_FOUND_ERROR = "Файл операции не найден";
const OPERATION_ARCHIVE_EMPTY_ERROR = "У операции нет загруженных файлов";
const OPERATION_ARCHIVE_NAME_FALLBACK = "operation-files";
const OPERATION_ARCHIVE_ENTRY_FALLBACK = "file";

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
	limits: {
		fileSize: OPERATION_FILE_SIZE_LIMIT,
		files: OPERATION_FILES_LIMIT,
	},
});

const parseOperationUpload = (request: Request, response: Response, next: NextFunction) => {
	operationUpload.array("files", OPERATION_FILES_LIMIT)(request, response, (error) => {
		if (!error) {
			const files = Array.isArray(request.files) ? request.files : [];
			assertOperationFilesTotalSize(files);
			next();
			return;
		}

		if (error instanceof multer.MulterError) {
			if (error.code === "LIMIT_FILE_SIZE") {
				next(new AppError(413, "Размер файла не должен превышать 100 MB"));
				return;
			}

			if (error.code === "LIMIT_FILE_COUNT") {
				next(new AppError(400, "Можно загрузить не более 10 файлов"));
				return;
			}

			next(new AppError(400, "Не удалось загрузить файлы операции"));
			return;
		}

		next(error);
	});
};

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
		const typeProduct = await getTypeProductById(parseId(String(request.params.id), "типа изделия"));

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
		const typeProduct = await updateTypeProduct(parseId(String(request.params.id), "типа изделия"), payload);

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
	requirePermission("/guide", "view"),
	asyncHandler(async (request, response) => {
		const searchValue = typeof request.query.search === "string"
			? request.query.search.trim()
			: "";
		const materialGroups = await listMaterialGroups(searchValue || undefined);

		response.json(materialGroups);
	}),
);

guideRouter.get(
	"/materialGroup/:id",
	requirePermission("/guide", "view"),
	asyncHandler(async (request, response) => {
		const materialGroup = await getMaterialGroupById(parseId(String(request.params.id), "группы материала"));

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
		const materialGroup = await updateMaterialGroup(parseId(String(request.params.id), "группы материала"), payload);

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
	requirePermission("/guide", "view"),
	asyncHandler(async (request, response) => {
		const searchValue = typeof request.query.search === "string"
			? request.query.search.trim()
			: "";
		const operationGroups = await listOperationGroups(searchValue || undefined);

		response.json(operationGroups);
	}),
);

guideRouter.get(
	"/operationGroup/:id",
	requirePermission("/guide", "view"),
	asyncHandler(async (request, response) => {
		const operationGroup = await getOperationGroupById(parseId(String(request.params.id), "группы операций"));

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
		const operationGroup = await updateOperationGroup(parseId(String(request.params.id), "группы операций"), payload);

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
	"/material/:id",
	requirePermission("/guide", "view"),
	asyncHandler(async (request, response) => {
		const material = await getMaterialById(parseId(String(request.params.id), "материала"));

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
		const material = await updateMaterial(parseId(String(request.params.id), "материала"), payload);

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
	"/operation/table",
	requirePermission("/guide", "view"),
	asyncHandler(async (request, response) => {
		const query = validate(getOperationsTableSchema, request.query);
		const table = await getOperationsTable(query);

		response.json(table);
	}),
);

guideRouter.get(
	"/operation/files/:fileId/download",
	requirePermission("/guide", "view"),
	asyncHandler(async (request, response, next) => {
		const operationFile = await getOperationFileDownloadInfo(parseId(String(request.params.fileId), "файла операции"));
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
		const operation = await getOperationFilesArchiveInfo(parseId(String(request.params.id), "операции"));

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
		const operation = await getOperationById(parseId(String(request.params.id), "операции"));

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

		const operation = await updateOperation(parseId(String(request.params.id), "операции"), payload, files);

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
