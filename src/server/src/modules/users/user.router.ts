import { Router } from "express";
import { AppError } from "../../shared/errors/app-error.js";
import { asyncHandler } from "../../shared/http/async-handler.js";
import { requirePermission } from "../../shared/http/permissions.js";
import { validate } from "../../shared/http/validate.js";
import { createUserSchema, updateUserSchema } from "./user.schemas.js";
import { createUser, getUserById, listUsers, updateUser } from "./user.service.js";

const parseId = (value: string) => {
	const id = Number.parseInt(value, 10);

	if (!Number.isInteger(id) || id <= 0) {
		throw new AppError(400, "Некорректный id пользователя");
	}

	return id;
};

export const userRouter = Router();

userRouter.get(
	"/",
	requirePermission("/users", "view"),
	asyncHandler(async (_request, response) => {
		const users = await listUsers();

		response.json(users);
	}),
);

userRouter.get(
	"/:id",
	requirePermission("/users", "view"),
	asyncHandler(async (request, response) => {
		const user = await getUserById(parseId(String(request.params.id)));

		response.json(user);
	}),
);

userRouter.post(
	"/",
	requirePermission("/users", "adding"),
	asyncHandler(async (request, response) => {
		const payload = validate(createUserSchema, request.body);
		const user = await createUser(payload);

		response.status(201).json(user);
	}),
);

userRouter.patch(
	"/:id",
	requirePermission("/users", "editing"),
	asyncHandler(async (request, response) => {
		const payload = validate(updateUserSchema, request.body);
		const user = await updateUser(parseId(String(request.params.id)), payload);

		response.json(user);
	}),
);
