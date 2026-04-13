import type { NextFunction, Request, Response } from "express";
import { AppError } from "../errors/app-error.js";

export const errorHandler = (
	error: unknown,
	_request: Request,
	response: Response,
	_next: NextFunction,
) => {
	if (error instanceof AppError) {
		response.status(error.statusCode).json({
			message: error.message,
		});
		return;
	}

	console.error("Необработанная ошибка", error);

	response.status(500).json({
		message: "Внутренняя ошибка сервера",
	});
};
