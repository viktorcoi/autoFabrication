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
	PRODUCT_FILES_LIMIT,
	PRODUCT_FILE_SIZE_LIMIT,
	PRODUCT_IMAGES_LIMIT,
	PRODUCT_UPLOAD_FILES_LIMIT,
	assertProductFilesTotalSize,
	assertProductImagesTotalSize,
	getProductFileAbsolutePath,
} from "../../shared/storage/products.js";
import {
	createProductSchema,
	deleteProductIdsSchema,
	getProductsSchema,
	getProductsTableSchema,
	updateProductSchema,
	updateProductsTableSchema,
} from "./product.schemas.js";
import {
	createProduct,
	deleteProducts,
	getProductById,
	getProductFileDownloadInfo,
	getProductFilesArchiveInfo,
	getProductsTable,
	listProducts,
	updateProduct,
	updateProductsTable,
} from "./product.service.js";

const parseId = (value: string) => {
	const id = Number.parseInt(value, 10);

	if (!Number.isInteger(id) || id <= 0) {
		throw new AppError(400, "Некорректный id изделия");
	}

	return id;
};

type ProductUploadFiles = {
	files: Express.Multer.File[];
	images: Express.Multer.File[];
};

export const productRouter = Router();

const PRODUCT_FILE_NOT_FOUND_ERROR = "Файл изделия не найден";
const PRODUCT_ARCHIVE_EMPTY_ERROR = "У изделия нет загруженных файлов";
const PRODUCT_ARCHIVE_NAME_FALLBACK = "product-files";
const PRODUCT_ARCHIVE_ENTRY_FALLBACK = "file";

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
	const sanitizedFileName = sanitizeArchiveEntryName(fileName, PRODUCT_ARCHIVE_ENTRY_FALLBACK);
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
				throw new AppError(404, PRODUCT_FILE_NOT_FOUND_ERROR);
			}

			throw error;
		}
	}
};

const productUpload = multer({
	storage: multer.memoryStorage(),
	defParamCharset: "utf8",
	limits: {
		fileSize: PRODUCT_FILE_SIZE_LIMIT,
		files: PRODUCT_UPLOAD_FILES_LIMIT,
	},
});

const getUploadFiles = (request: Request): ProductUploadFiles => {
	const requestFiles = request.files;

	if (!requestFiles || Array.isArray(requestFiles)) {
		return {
			files: [],
			images: [],
		};
	}

	return {
		files: Array.isArray(requestFiles.files) ? requestFiles.files : [],
		images: Array.isArray(requestFiles.images) ? requestFiles.images : [],
	};
};

const parseProductUpload = (request: Request, response: Response, next: NextFunction) => {
	productUpload.fields([
		{ name: "files", maxCount: PRODUCT_FILES_LIMIT },
		{ name: "images", maxCount: PRODUCT_IMAGES_LIMIT },
	])(request, response, (error) => {
		if (!error) {
			try {
				const { files, images } = getUploadFiles(request);
				assertProductFilesTotalSize(files);
				assertProductImagesTotalSize(images);
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
				next(new AppError(400, "Можно загрузить не более 20 файлов и 20 изображений"));
				return;
			}

			if (error.code === "LIMIT_UNEXPECTED_FILE") {
				next(new AppError(400, "Можно загрузить не более 20 файлов и 20 изображений"));
				return;
			}

			next(new AppError(400, "Не удалось загрузить файлы изделия"));
			return;
		}

		next(error);
	});
};

productRouter.get(
	"/",
	requirePermission("/products", "view"),
	asyncHandler(async (request, response) => {
		const query = validate(getProductsSchema, request.query);
		const products = await listProducts(query);

		response.json(products);
	}),
);

productRouter.get(
	"/table",
	requirePermission("/products", "view"),
	asyncHandler(async (request, response) => {
		const query = validate(getProductsTableSchema, request.query);
		const table = await getProductsTable(query);

		response.json(table);
	}),
);

productRouter.get(
	"/files/:fileId/download",
	requirePermission("/products", "view"),
	asyncHandler(async (request, response, next) => {
		const productFile = await getProductFileDownloadInfo(parseId(String(request.params.fileId)));
		const absolutePath = getProductFileAbsolutePath(productFile.storagePath);

		if (!absolutePath) {
			throw new AppError(500, "Не удалось получить путь к файлу изделия");
		}

		response.download(absolutePath, productFile.originalName, (error) => {
			if (error && !response.headersSent) {
				if (typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT") {
					next(new AppError(404, PRODUCT_FILE_NOT_FOUND_ERROR));
					return;
				}

				next(error);
			}
		});
	}),
);

productRouter.get(
	"/:id/files/archive",
	requirePermission("/products", "view"),
	asyncHandler(async (request, response, next) => {
		const product = await getProductFilesArchiveInfo(parseId(String(request.params.id)));

		if (!product.files.length) {
			throw new AppError(404, PRODUCT_ARCHIVE_EMPTY_ERROR);
		}

		const archiveFiles = product.files.map((file) => {
			const absolutePath = getProductFileAbsolutePath(file.storagePath);

			if (!absolutePath) {
				throw new AppError(500, "Не удалось получить путь к файлу изделия");
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
		const archiveName = `${sanitizeArchiveEntryName(product.name, PRODUCT_ARCHIVE_NAME_FALLBACK)}.zip`;
		const usedNames = new Set<string>();

		response.attachment(archiveName);

		archive.on("warning", (error: Error & { code?: string }) => {
			if (error.code === "ENOENT") {
				if (!response.headersSent) {
					next(new AppError(404, PRODUCT_FILE_NOT_FOUND_ERROR));
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

productRouter.get(
	"/:id",
	requirePermission("/products", "view"),
	asyncHandler(async (request, response) => {
		const product = await getProductById(parseId(String(request.params.id)));

		response.json(product);
	}),
);

productRouter.post(
	"/",
	requirePermission("/products", "adding"),
	parseProductUpload,
	asyncHandler(async (request, response) => {
		const auth = requireAuth(request, response);
		const payload = validate(createProductSchema, request.body ?? {});
		const { files, images } = getUploadFiles(request);
		const product = await createProduct(payload, files, images, auth.userId);

		response.status(201).json(product);
	}),
);

productRouter.patch(
	"/table",
	requirePermission("/products", "view"),
	asyncHandler(async (request, response) => {
		const auth = requireAuth(request, response);
		const payload = validate(updateProductsTableSchema, request.body ?? {});
		const result = await updateProductsTable(payload, auth.userId);

		response.json(result);
	}),
);

productRouter.patch(
	"/:id",
	requirePermission("/products", "editing"),
	parseProductUpload,
	asyncHandler(async (request, response) => {
		const payload = validate(updateProductSchema, request.body ?? {});
		const { files, images } = getUploadFiles(request);

		if (Object.keys(payload).length === 0 && files.length === 0 && images.length === 0) {
			throw new AppError(400, "Нужно передать хотя бы одно поле для обновления");
		}

		const product = await updateProduct(parseId(String(request.params.id)), payload, files, images);

		response.json(product);
	}),
);

productRouter.delete(
	"/",
	requirePermission("/products", "view"),
	asyncHandler(async (request, response) => {
		const auth = requireAuth(request, response);
		const payload = validate(deleteProductIdsSchema, request.body ?? []);
		const result = await deleteProducts(payload, auth.userId);

		response.json(result);
	}),
);
