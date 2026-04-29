import { Router } from "express";
import { AppError } from "../../shared/errors/app-error.js";
import { asyncHandler } from "../../shared/http/async-handler.js";
import { requireAuth } from "../../shared/http/auth.js";
import { requirePermission } from "../../shared/http/permissions.js";
import { validate } from "../../shared/http/validate.js";
import {
	createMaterialGroupSchema,
	createMaterialSchema,
	createOperationGroupSchema,
	createTypeProductSchema,
	deleteMaterialGroupIdsSchema,
	deleteMaterialIdsSchema,
	deleteOperationGroupIdsSchema,
	deleteTypeProductIdsSchema,
	getMaterialGroupsTableSchema,
	getMaterialsTableSchema,
	getOperationGroupsTableSchema,
	getTypeProductsTableSchema,
	updateMaterialGroupSchema,
	updateMaterialGroupsTableSchema,
	updateMaterialSchema,
	updateMaterialsTableSchema,
	updateOperationGroupSchema,
	updateOperationGroupsTableSchema,
	updateTypeProductSchema,
	updateTypeProductsTableSchema,
} from "./guide.schemas.js";
import {
	createMaterial,
	createMaterialGroup,
	createOperationGroup,
	createTypeProduct,
	deleteMaterialGroups,
	deleteMaterials,
	deleteOperationGroups,
	deleteTypeProducts,
	getMaterialById,
	getMaterialGroupById,
	getMaterialGroupsTable,
	getMaterialsTable,
	getOperationGroupById,
	getOperationGroupsTable,
	getTypeProductById,
	getTypeProductsTable,
	listMaterialGroups,
	updateMaterial,
	updateMaterialGroup,
	updateMaterialGroupsTable,
	updateMaterialsTable,
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
