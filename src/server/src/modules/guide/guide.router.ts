import { Router } from "express";
import { AppError } from "../../shared/errors/app-error.js";
import { asyncHandler } from "../../shared/http/async-handler.js";
import { requireAuth } from "../../shared/http/auth.js";
import { requirePermission } from "../../shared/http/permissions.js";
import { validate } from "../../shared/http/validate.js";
import {
	createTypeProductSchema,
	deleteTypeProductIdsSchema,
	getTypeProductsTableSchema,
	updateTypeProductSchema,
	updateTypeProductsTableSchema,
} from "./guide.schemas.js";
import {
	createTypeProduct,
	deleteTypeProducts,
	getTypeProductById,
	getTypeProductsTable,
	updateTypeProduct,
	updateTypeProductsTable,
} from "./guide.service.js";

const parseId = (value: string) => {
	const id = Number.parseInt(value, 10);

	if (!Number.isInteger(id) || id <= 0) {
		throw new AppError(400, "Некорректный id типа изделия");
	}

	return id;
};

export const guideRouter = Router();

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
