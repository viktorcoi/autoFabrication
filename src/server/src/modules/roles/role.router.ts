import { Router } from "express";
import { AppError } from "../../shared/errors/app-error.js";
import { asyncHandler } from "../../shared/http/async-handler.js";
import { validate } from "../../shared/http/validate.js";
import { createRoleSchema, updateRoleSchema } from "./role.schemas.js";
import { createRole, getRoleById, listRoles, updateRole } from "./role.service.js";

const parseId = (value: string) => {
	const id = Number.parseInt(value, 10);

	if (!Number.isInteger(id) || id <= 0) {
		throw new AppError(400, "Некорректный id роли");
	}

	return id;
};

export const roleRouter = Router();

roleRouter.get(
	"/",
	asyncHandler(async (_request, response) => {
		const roles = await listRoles();

		response.json(roles);
	}),
);

roleRouter.get(
	"/:id",
	asyncHandler(async (request, response) => {
		const role = await getRoleById(parseId(String(request.params.id)));

		response.json(role);
	}),
);

roleRouter.post(
	"/",
	asyncHandler(async (request, response) => {
		const payload = validate(createRoleSchema, request.body);
		const role = await createRole(payload);

		response.status(201).json(role);
	}),
);

roleRouter.patch(
	"/:id",
	asyncHandler(async (request, response) => {
		const payload = validate(updateRoleSchema, request.body);
		const role = await updateRole(parseId(String(request.params.id)), payload);

		response.json(role);
	}),
);
