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
	PROCESS_OPERATION_FILES_LIMIT,
	PROCESS_OPERATION_FILE_SIZE_LIMIT,
	assertProcessOperationFilesTotalSize,
	getProcessOperationFileAbsolutePath,
} from "../../shared/storage/process-operations.js";
import {
	getProcessOperationById,
	getProcessOperationFileDownloadInfo,
	getProcessOperationFilesArchiveInfo,
	getProcessOperationsTable,
	listProcessOperations,
	updateProcessOperation,
	updateProcessOperations,
} from "./process-operation.service.js";
import {
	getProcessOperationsSchema,
	getProcessOperationsTableSchema,
	updateProcessOperationSchema,
	updateProcessOperationsSchema,
} from "./process-operation.schemas.js";

const parseId = (value: string) => {
	const id = Number.parseInt(value, 10);

	if (!Number.isInteger(id) || id <= 0) {
		throw new AppError(400, "Некорректный id операции техпроцесса");
	}

	return id;
};

export const processOperationRouter = Router();

const PROCESS_OPERATION_FILE_NOT_FOUND_ERROR = "Файл операции техпроцесса не найден";
const PROCESS_OPERATION_ARCHIVE_EMPTY_ERROR = "У операции техпроцесса нет загруженных файлов";
const PROCESS_OPERATION_ARCHIVE_NAME_FALLBACK = "process-operation-files";
const PROCESS_OPERATION_ARCHIVE_ENTRY_FALLBACK = "file";

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
	const sanitizedFileName = sanitizeArchiveEntryName(fileName, PROCESS_OPERATION_ARCHIVE_ENTRY_FALLBACK);
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

const ensureArchiveFilesExist = async (absolutePaths: string[]) => {
	for (const absolutePath of absolutePaths) {
		try {
			await access(absolutePath);
		} catch (error) {
			if (typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT") {
				throw new AppError(404, PROCESS_OPERATION_FILE_NOT_FOUND_ERROR);
			}

			throw error;
		}
	}
};

const processOperationUpload = multer({
	storage: multer.memoryStorage(),
	defParamCharset: "utf8",
	limits: {
		fileSize: PROCESS_OPERATION_FILE_SIZE_LIMIT,
		files: PROCESS_OPERATION_FILES_LIMIT,
	},
});

const parseProcessOperationUpload = (request: Request, response: Response, next: NextFunction) => {
	processOperationUpload.array("files", PROCESS_OPERATION_FILES_LIMIT)(request, response, (error) => {
		if (!error) {
			try {
				const files = Array.isArray(request.files) ? request.files : [];
				assertProcessOperationFilesTotalSize(files);
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

			if (error.code === "LIMIT_FILE_COUNT" || error.code === "LIMIT_UNEXPECTED_FILE") {
				next(new AppError(400, "Можно загрузить не более 20 файлов"));
				return;
			}

			next(new AppError(400, "Не удалось загрузить файлы операции техпроцесса"));
			return;
		}

		next(error);
	});
};

processOperationRouter.get(
	"/table",
	requirePermission("/products", "viewProcess"),
	asyncHandler(async (request, response) => {
		const auth = requireAuth(request, response);
		const query = validate(getProcessOperationsTableSchema, request.query);
		const table = await getProcessOperationsTable(query, auth.userId);

		response.json(table);
	}),
);

processOperationRouter.get(
	"/files/:fileId/download",
	requirePermission("/products", "viewProcess"),
	asyncHandler(async (request, response, next) => {
		const processOperationFile = await getProcessOperationFileDownloadInfo(parseId(String(request.params.fileId)));
		const absolutePath = getProcessOperationFileAbsolutePath(processOperationFile.storagePath);

		if (!absolutePath) {
			throw new AppError(500, "Не удалось получить путь к файлу операции техпроцесса");
		}

		response.download(absolutePath, processOperationFile.originalName, (error) => {
			if (error && !response.headersSent) {
				if (typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT") {
					next(new AppError(404, PROCESS_OPERATION_FILE_NOT_FOUND_ERROR));
					return;
				}

				next(error);
			}
		});
	}),
);

processOperationRouter.get(
	"/:id/files/archive",
	requirePermission("/products", "viewProcess"),
	asyncHandler(async (request, response, next) => {
		const processOperation = await getProcessOperationFilesArchiveInfo(parseId(String(request.params.id)));

		if (!processOperation.files.length) {
			throw new AppError(404, PROCESS_OPERATION_ARCHIVE_EMPTY_ERROR);
		}

		const archiveFiles = processOperation.files.map((file) => {
			const absolutePath = getProcessOperationFileAbsolutePath(file.storagePath);

			if (!absolutePath) {
				throw new AppError(500, "Не удалось получить путь к файлу операции техпроцесса");
			}

			return {
				absolutePath,
				originalName: file.originalName,
			};
		});

		await ensureArchiveFilesExist(archiveFiles.map((file) => file.absolutePath));

		const archive = archiver("zip", {
			zlib: {
				level: 9,
			},
		});
		const archiveName = `${sanitizeArchiveEntryName(processOperation.name, PROCESS_OPERATION_ARCHIVE_NAME_FALLBACK)}.zip`;
		const usedNames = new Set<string>();

		response.attachment(archiveName);

		archive.on("warning", (error: Error & { code?: string }) => {
			if (error.code === "ENOENT") {
				if (!response.headersSent) {
					next(new AppError(404, PROCESS_OPERATION_FILE_NOT_FOUND_ERROR));
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

processOperationRouter.get(
	"/",
	requirePermission("/products", "viewProcess"),
	asyncHandler(async (request, response) => {
		const query = validate(getProcessOperationsSchema, request.query);
		const operations = await listProcessOperations(query);

		response.json(operations);
	}),
);

processOperationRouter.put(
	"/process/:processId",
	requirePermission("/products", "viewProcess"),
	asyncHandler(async (request, response) => {
		const auth = requireAuth(request, response);
		const payload = validate(updateProcessOperationsSchema, request.body ?? {});
		const operations = await updateProcessOperations(parseId(String(request.params.processId)), payload, auth.userId);

		response.json(operations);
	}),
);

processOperationRouter.get(
	"/:id",
	requirePermission("/products", "viewProcess"),
	asyncHandler(async (request, response) => {
		const processOperation = await getProcessOperationById(parseId(String(request.params.id)));

		response.json(processOperation);
	}),
);

processOperationRouter.patch(
	"/:id",
	requirePermission("/products", "viewProcess"),
	parseProcessOperationUpload,
	asyncHandler(async (request, response) => {
		const auth = requireAuth(request, response);
		const payload = validate(updateProcessOperationSchema, request.body ?? {});
		const files = Array.isArray(request.files) ? request.files : [];

		if (Object.keys(payload).length === 0 && files.length === 0) {
			throw new AppError(400, "Нужно передать хотя бы одно поле для обновления");
		}

		const processOperation = await updateProcessOperation(parseId(String(request.params.id)), payload, files, auth.userId);

		response.json(processOperation);
	}),
);
