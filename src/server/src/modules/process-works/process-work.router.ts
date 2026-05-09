import { Router } from "express";
import { AppError } from "../../shared/errors/app-error.js";
import { asyncHandler } from "../../shared/http/async-handler.js";
import { requireAuth } from "../../shared/http/auth.js";
import { requirePermission } from "../../shared/http/permissions.js";
import { validate } from "../../shared/http/validate.js";
import {
	getProcessWorkById,
	getProcessWorksTable,
	listProcessWorks,
	updateProcessWork,
	updateProcessWorks,
} from "./process-work.service.js";
import {
	getProcessWorksSchema,
	getProcessWorksTableSchema,
	updateProcessWorkSchema,
	updateProcessWorksSchema,
} from "./process-work.schemas.js";

const parseId = (value: string) => {
	const id = Number.parseInt(value, 10);

	if (!Number.isInteger(id) || id <= 0) {
		throw new AppError(400, "Некорректный id работы");
	}

	return id;
};

export const processWorkRouter = Router();

processWorkRouter.get(
	"/table",
	requirePermission("/products", "viewProcess"),
	asyncHandler(async (request, response) => {
		const auth = requireAuth(request, response);
		const query = validate(getProcessWorksTableSchema, request.query);
		const table = await getProcessWorksTable(query, auth.userId);

		response.json(table);
	}),
);

processWorkRouter.get(
	"/",
	requirePermission("/products", "viewProcess"),
	asyncHandler(async (request, response) => {
		const query = validate(getProcessWorksSchema, request.query);
		const works = await listProcessWorks(query);

		response.json(works);
	}),
);

processWorkRouter.put(
	"/step/:stepId",
	requirePermission("/products", "viewProcess"),
	asyncHandler(async (request, response) => {
		const auth = requireAuth(request, response);
		const payload = validate(updateProcessWorksSchema, request.body ?? {});
		const works = await updateProcessWorks(parseId(String(request.params.stepId)), payload, auth.userId);

		response.json(works);
	}),
);

processWorkRouter.get(
	"/:id",
	requirePermission("/products", "viewProcess"),
	asyncHandler(async (request, response) => {
		const processWork = await getProcessWorkById(parseId(String(request.params.id)));

		response.json(processWork);
	}),
);

processWorkRouter.patch(
	"/:id",
	requirePermission("/products", "viewProcess"),
	asyncHandler(async (request, response) => {
		const auth = requireAuth(request, response);
		const payload = validate(updateProcessWorkSchema, request.body ?? {});

		if (Object.keys(payload).length === 0) {
			throw new AppError(400, "Нужно передать хотя бы одно поле для обновления");
		}

		const processWork = await updateProcessWork(parseId(String(request.params.id)), payload, auth.userId);

		response.json(processWork);
	}),
);
