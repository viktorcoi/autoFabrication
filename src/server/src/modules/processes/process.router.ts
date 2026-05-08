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
	PROCESS_FILES_LIMIT,
	PROCESS_FILE_SIZE_LIMIT,
	assertProcessFilesTotalSize,
	getProcessFileAbsolutePath,
} from "../../shared/storage/processes.js";
import {
	createProcessSchema,
	deleteProcessIdsSchema,
	getProcessesTableSchema,
	updateProcessAccessSchema,
	updateProcessSchema,
	updateProcessesTableSchema,
} from "./process.schemas.js";
import {
	createProcess,
	deleteProcesses,
	getProcessById,
	getProcessFileDownloadInfo,
	getProcessFilesArchiveInfo,
	getProcessesTable,
	updateProcess,
	updateProcessAccess,
	updateProcessesTable,
} from "./process.service.js";

const parseId = (value: string) => {
	const id = Number.parseInt(value, 10);

	if (!Number.isInteger(id) || id <= 0) {
		throw new AppError(400, "Некорректный id техпроцесса");
	}

	return id;
};

export const processRouter = Router();

const PROCESS_FILE_NOT_FOUND_ERROR = "Файл техпроцесса не найден";
const PROCESS_ARCHIVE_EMPTY_ERROR = "У техпроцесса нет загруженных файлов";
const PROCESS_ARCHIVE_NAME_FALLBACK = "process-files";
const PROCESS_ARCHIVE_ENTRY_FALLBACK = "file";

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
	const sanitizedFileName = sanitizeArchiveEntryName(fileName, PROCESS_ARCHIVE_ENTRY_FALLBACK);
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
				throw new AppError(404, PROCESS_FILE_NOT_FOUND_ERROR);
			}

			throw error;
		}
	}
};

const processUpload = multer({
	storage: multer.memoryStorage(),
	defParamCharset: "utf8",
	limits: {
		fileSize: PROCESS_FILE_SIZE_LIMIT,
		files: PROCESS_FILES_LIMIT,
	},
});

const parseProcessUpload = (request: Request, response: Response, next: NextFunction) => {
	processUpload.array("files", PROCESS_FILES_LIMIT)(request, response, (error) => {
		if (!error) {
			try {
				const files = Array.isArray(request.files) ? request.files : [];
				assertProcessFilesTotalSize(files);
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

			next(new AppError(400, "Не удалось загрузить файлы техпроцесса"));
			return;
		}

		next(error);
	});
};

processRouter.get(
	"/table",
	requirePermission("/products", "viewProcess"),
	asyncHandler(async (request, response) => {
		const auth = requireAuth(request, response);
		const query = validate(getProcessesTableSchema, request.query);
		const table = await getProcessesTable(query, auth.userId);

		response.json(table);
	}),
);

processRouter.get(
	"/files/:fileId/download",
	requirePermission("/products", "viewProcess"),
	asyncHandler(async (request, response, next) => {
		const processFile = await getProcessFileDownloadInfo(parseId(String(request.params.fileId)));
		const absolutePath = getProcessFileAbsolutePath(processFile.storagePath);

		if (!absolutePath) {
			throw new AppError(500, "Не удалось получить путь к файлу техпроцесса");
		}

		response.download(absolutePath, processFile.originalName, (error) => {
			if (error && !response.headersSent) {
				if (typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT") {
					next(new AppError(404, PROCESS_FILE_NOT_FOUND_ERROR));
					return;
				}

				next(error);
			}
		});
	}),
);

processRouter.get(
	"/:id/files/archive",
	requirePermission("/products", "viewProcess"),
	asyncHandler(async (request, response, next) => {
		const process = await getProcessFilesArchiveInfo(parseId(String(request.params.id)));

		if (!process.files.length) {
			throw new AppError(404, PROCESS_ARCHIVE_EMPTY_ERROR);
		}

		const archiveFiles = process.files.map((file) => {
			const absolutePath = getProcessFileAbsolutePath(file.storagePath);

			if (!absolutePath) {
				throw new AppError(500, "Не удалось получить путь к файлу техпроцесса");
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
		const archiveName = `${sanitizeArchiveEntryName(process.name, PROCESS_ARCHIVE_NAME_FALLBACK)}.zip`;
		const usedNames = new Set<string>();

		response.attachment(archiveName);

		archive.on("warning", (error: Error & { code?: string }) => {
			if (error.code === "ENOENT") {
				if (!response.headersSent) {
					next(new AppError(404, PROCESS_FILE_NOT_FOUND_ERROR));
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

processRouter.get(
	"/:id",
	requirePermission("/products", "viewProcess"),
	asyncHandler(async (request, response) => {
		const process = await getProcessById(parseId(String(request.params.id)));

		response.json(process);
	}),
);

processRouter.post(
	"/",
	requirePermission("/products", "addingProcess"),
	parseProcessUpload,
	asyncHandler(async (request, response) => {
		const auth = requireAuth(request, response);
		const payload = validate(createProcessSchema, request.body ?? {});
		const files = Array.isArray(request.files) ? request.files : [];
		const process = await createProcess(payload, files, auth.userId);

		response.status(201).json(process);
	}),
);

processRouter.patch(
	"/table",
	requirePermission("/products", "viewProcess"),
	asyncHandler(async (request, response) => {
		const auth = requireAuth(request, response);
		const payload = validate(updateProcessesTableSchema, request.body ?? {});
		const result = await updateProcessesTable(payload, auth.userId);

		response.json(result);
	}),
);

processRouter.patch(
	"/:id/access",
	requirePermission("/products", "viewProcess"),
	asyncHandler(async (request, response) => {
		const auth = requireAuth(request, response);
		const payload = validate(updateProcessAccessSchema, request.body ?? {});
		const process = await updateProcessAccess(parseId(String(request.params.id)), payload, auth.userId);

		response.json(process);
	}),
);

processRouter.patch(
	"/:id",
	requirePermission("/products", "viewProcess"),
	parseProcessUpload,
	asyncHandler(async (request, response) => {
		const auth = requireAuth(request, response);
		const payload = validate(updateProcessSchema, request.body ?? {});
		const files = Array.isArray(request.files) ? request.files : [];

		if (Object.keys(payload).length === 0 && files.length === 0) {
			throw new AppError(400, "Нужно передать хотя бы одно поле для обновления");
		}

		const process = await updateProcess(parseId(String(request.params.id)), payload, files, auth.userId);

		response.json(process);
	}),
);

processRouter.delete(
	"/",
	requirePermission("/products", "viewProcess"),
	asyncHandler(async (request, response) => {
		const auth = requireAuth(request, response);
		const payload = validate(deleteProcessIdsSchema, request.body ?? []);
		const result = await deleteProcesses(payload, auth.userId);

		response.json(result);
	}),
);
