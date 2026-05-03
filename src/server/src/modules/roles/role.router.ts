import { Router } from "express";
import { AppError } from "../../shared/errors/app-error.js";
import { asyncHandler } from "../../shared/http/async-handler.js";
import {
	assertPermission,
	hasPermission,
	loadRolePermissions,
	requirePermission,
} from "../../shared/http/permissions.js";
import { validate } from "../../shared/http/validate.js";
import {
	createRoleSchema,
	updateRoleDetailsSchema,
	updateRolePermissionsSchema,
} from "./role.schemas.js";
import {
	createRole,
	deleteRole,
	getRoleById,
	listRoles,
	updateRoleDetails,
	updateRolePermissions,
} from "./role.service.js";

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
	asyncHandler(async (request, response) => {
		const permissions = await loadRolePermissions(request, response);
		const forSelect = request.query.forSelect === "true";

		if (forSelect) {
			const canReadRolesForSelect = (
				hasPermission(permissions, "/roles", "view")
				|| hasPermission(permissions, "/users", "view")
				|| hasPermission(permissions, "/users", "adding")
				|| hasPermission(permissions, "/users", "editing")
			);

			if (!canReadRolesForSelect) {
				throw new AppError(403, "У вас отсутствует доступ для данного действия");
			}
		} else {
			assertPermission(permissions, "/roles", "view");
		}

		const searchValue = typeof request.query.search === "string"
			? request.query.search.trim()
			: "";
		const roles = await listRoles(searchValue || undefined);

		response.json(roles);
	}),
);

roleRouter.get(
	"/:id",
	requirePermission("/roles", "view"),
	asyncHandler(async (request, response) => {
		const role = await getRoleById(parseId(String(request.params.id)));

		response.json(role);
	}),
);

roleRouter.post(
	"/",
	requirePermission("/roles", "adding"),
	asyncHandler(async (request, response) => {
		const payload = validate(createRoleSchema, request.body);
		const role = await createRole(payload);

		response.status(201).json(role);
	}),
);

roleRouter.patch(
	"/:id",
	requirePermission("/roles", "editing"),
	asyncHandler(async (request, response) => {
		const payload = validate(updateRoleDetailsSchema, request.body);
		const role = await updateRoleDetails(parseId(String(request.params.id)), payload);

		response.json(role);
	}),
);

roleRouter.patch(
	"/:id/permissions",
	requirePermission("/roles", "changeAccess"),
	asyncHandler(async (request, response) => {
		const payload = validate(updateRolePermissionsSchema, request.body);
		const role = await updateRolePermissions(parseId(String(request.params.id)), payload.permissions);

		response.json(role);
	}),
);

roleRouter.delete(
	"/:id",
	requirePermission("/roles", "removing"),
	asyncHandler(async (request, response) => {
		await deleteRole(parseId(String(request.params.id)));

		response.status(204).send();
	}),
);
