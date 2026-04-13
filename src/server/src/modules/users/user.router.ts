import { Router } from "express";
import { AppError } from "../../shared/errors/app-error.js";
import { asyncHandler } from "../../shared/http/async-handler.js";
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
	asyncHandler(async (_request, response) => {
		const users = await listUsers();

		response.json({
			items: users,
		});
	}),
);

userRouter.get(
	"/:id",
	asyncHandler(async (request, response) => {
		const user = await getUserById(parseId(String(request.params.id)));

		response.json(user);
	}),
);

userRouter.post(
	"/",
	asyncHandler(async (request, response) => {
		const payload = validate(createUserSchema, request.body);
		const user = await createUser(payload);

		response.status(201).json(user);
	}),
);

userRouter.patch(
	"/:id",
	asyncHandler(async (request, response) => {
		const payload = validate(updateUserSchema, request.body);
		const user = await updateUser(parseId(String(request.params.id)), payload);

		response.json(user);
	}),
);
