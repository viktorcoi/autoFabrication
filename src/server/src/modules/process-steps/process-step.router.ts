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
	PROCESS_STEP_FILES_LIMIT,
	PROCESS_STEP_FILE_SIZE_LIMIT,
	assertProcessStepFilesTotalSize,
	getProcessStepFileAbsolutePath,
} from "../../shared/storage/process-steps.js";
import {
	createProcessStep,
	getProcessStepById,
	getProcessStepFileDownloadInfo,
	getProcessStepFilesArchiveInfo,
	getProcessStepsTable,
	listProcessSteps,
	updateProcessStep,
	updateProcessSteps,
	type ProcessStepFilesByClientId,
} from "./process-step.service.js";
import {
	createProcessStepSchema,
	getProcessStepsSchema,
	getProcessStepsTableSchema,
	updateProcessStepSchema,
	updateProcessStepsSchema,
} from "./process-step.schemas.js";

const parseId = (value: string) => {
	const id = Number.parseInt(value, 10);

	if (!Number.isInteger(id) || id <= 0) {
		throw new AppError(400, "Некорректный id этапа");
	}

	return id;
};

export const processStepRouter = Router();

const PROCESS_STEP_SYNC_FILES_LIMIT = 500;
const PROCESS_STEP_FILE_FIELD_PREFIX = "files__";
const PROCESS_STEP_FILE_NOT_FOUND_ERROR = "Файл этапа не найден";
const PROCESS_STEP_ARCHIVE_EMPTY_ERROR = "У этапа нет загруженных файлов";
const PROCESS_STEP_ARCHIVE_NAME_FALLBACK = "process-step-files";
const PROCESS_STEP_ARCHIVE_ENTRY_FALLBACK = "file";

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
	const sanitizedFileName = sanitizeArchiveEntryName(fileName, PROCESS_STEP_ARCHIVE_ENTRY_FALLBACK);
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
				throw new AppError(404, PROCESS_STEP_FILE_NOT_FOUND_ERROR);
			}

			throw error;
		}
	}
};

const processStepUpload = multer({
	storage: multer.memoryStorage(),
	defParamCharset: "utf8",
	limits: {
		fileSize: PROCESS_STEP_FILE_SIZE_LIMIT,
		files: PROCESS_STEP_FILES_LIMIT,
	},
});

const processStepSyncUpload = multer({
	storage: multer.memoryStorage(),
	defParamCharset: "utf8",
	limits: {
		fileSize: PROCESS_STEP_FILE_SIZE_LIMIT,
		files: PROCESS_STEP_SYNC_FILES_LIMIT,
	},
});

const parseProcessStepUpload = (request: Request, response: Response, next: NextFunction) => {
	processStepUpload.array("files", PROCESS_STEP_FILES_LIMIT)(request, response, (error) => {
		if (!error) {
			try {
				const files = Array.isArray(request.files) ? request.files : [];
				assertProcessStepFilesTotalSize(files);
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

			next(new AppError(400, "Не удалось загрузить файлы этапа"));
			return;
		}

		next(error);
	});
};

const parseProcessStepSyncUpload = (request: Request, response: Response, next: NextFunction) => {
	processStepSyncUpload.any()(request, response, (error) => {
		if (!error) {
			next();
			return;
		}

		if (error instanceof multer.MulterError) {
			if (error.code === "LIMIT_FILE_SIZE") {
				next(new AppError(413, "Размер файла не должен превышать 100 MB"));
				return;
			}

			if (error.code === "LIMIT_FILE_COUNT" || error.code === "LIMIT_UNEXPECTED_FILE") {
				next(new AppError(400, "Можно загрузить не более 500 файлов за один запрос"));
				return;
			}

			next(new AppError(400, "Не удалось загрузить файлы этапов"));
			return;
		}

		next(error);
	});
};

const getFilesByClientId = (files: Express.Multer.File[]): ProcessStepFilesByClientId => {
	const filesByClientId: ProcessStepFilesByClientId = new Map();

	for (const file of files) {
		if (!file.fieldname.startsWith(PROCESS_STEP_FILE_FIELD_PREFIX)) {
			continue;
		}

		const clientId = file.fieldname.slice(PROCESS_STEP_FILE_FIELD_PREFIX.length);
		const currentFiles = filesByClientId.get(clientId) ?? [];

		currentFiles.push(file);
		filesByClientId.set(clientId, currentFiles);
	}

	return filesByClientId;
};

processStepRouter.get(
	"/table",
	requirePermission("/products", "viewProcess"),
	asyncHandler(async (request, response) => {
		const auth = requireAuth(request, response);
		const query = validate(getProcessStepsTableSchema, request.query);
		const table = await getProcessStepsTable(query, auth.userId);

		response.json(table);
	}),
);

processStepRouter.get(
	"/files/:fileId/download",
	requirePermission("/products", "viewProcess"),
	asyncHandler(async (request, response, next) => {
		const processStepFile = await getProcessStepFileDownloadInfo(parseId(String(request.params.fileId)));
		const absolutePath = getProcessStepFileAbsolutePath(processStepFile.storagePath);

		if (!absolutePath) {
			throw new AppError(500, "Не удалось получить путь к файлу этапа");
		}

		response.download(absolutePath, processStepFile.originalName, (error) => {
			if (error && !response.headersSent) {
				if (typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT") {
					next(new AppError(404, PROCESS_STEP_FILE_NOT_FOUND_ERROR));
					return;
				}

				next(error);
			}
		});
	}),
);

processStepRouter.get(
	"/:id/files/archive",
	requirePermission("/products", "viewProcess"),
	asyncHandler(async (request, response, next) => {
		const processStep = await getProcessStepFilesArchiveInfo(parseId(String(request.params.id)));

		if (!processStep.files.length) {
			throw new AppError(404, PROCESS_STEP_ARCHIVE_EMPTY_ERROR);
		}

		const archiveFiles = processStep.files.map((file) => {
			const absolutePath = getProcessStepFileAbsolutePath(file.storagePath);

			if (!absolutePath) {
				throw new AppError(500, "Не удалось получить путь к файлу этапа");
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
		const archiveName = `${sanitizeArchiveEntryName(processStep.name, PROCESS_STEP_ARCHIVE_NAME_FALLBACK)}.zip`;
		const usedNames = new Set<string>();

		response.attachment(archiveName);

		archive.on("warning", (error: Error & { code?: string }) => {
			if (error.code === "ENOENT") {
				if (!response.headersSent) {
					next(new AppError(404, PROCESS_STEP_FILE_NOT_FOUND_ERROR));
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

processStepRouter.get(
	"/",
	requirePermission("/products", "viewProcess"),
	asyncHandler(async (request, response) => {
		const query = validate(getProcessStepsSchema, request.query);
		const steps = await listProcessSteps(query);

		response.json(steps);
	}),
);

processStepRouter.put(
	"/operation/:operationId",
	requirePermission("/products", "viewProcess"),
	parseProcessStepSyncUpload,
	asyncHandler(async (request, response) => {
		const auth = requireAuth(request, response);
		const payload = validate(updateProcessStepsSchema, request.body ?? {});
		const files = Array.isArray(request.files) ? request.files : [];
		const steps = await updateProcessSteps(
			parseId(String(request.params.operationId)),
			payload,
			getFilesByClientId(files),
			auth.userId,
		);

		response.json(steps);
	}),
);

processStepRouter.post(
	"/operation/:operationId",
	requirePermission("/products", "viewProcess"),
	parseProcessStepUpload,
	asyncHandler(async (request, response) => {
		const auth = requireAuth(request, response);
		const payload = validate(createProcessStepSchema, request.body ?? {});
		const files = Array.isArray(request.files) ? request.files : [];
		const step = await createProcessStep(parseId(String(request.params.operationId)), payload, files, auth.userId);

		response.status(201).json(step);
	}),
);

processStepRouter.get(
	"/:id",
	requirePermission("/products", "viewProcess"),
	asyncHandler(async (request, response) => {
		const processStep = await getProcessStepById(parseId(String(request.params.id)));

		response.json(processStep);
	}),
);

processStepRouter.patch(
	"/:id",
	requirePermission("/products", "viewProcess"),
	parseProcessStepUpload,
	asyncHandler(async (request, response) => {
		const auth = requireAuth(request, response);
		const payload = validate(updateProcessStepSchema, request.body ?? {});
		const files = Array.isArray(request.files) ? request.files : [];

		if (Object.keys(payload).length === 0 && files.length === 0) {
			throw new AppError(400, "Нужно передать хотя бы одно поле для обновления");
		}

		const processStep = await updateProcessStep(parseId(String(request.params.id)), payload, files, auth.userId);

		response.json(processStep);
	}),
);
