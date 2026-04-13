import type { NextFunction, Request, Response } from "express";

type AsyncRequestHandler = (request: Request, response: Response, next: NextFunction) => Promise<void>;

export const asyncHandler = (handler: AsyncRequestHandler) => (request: Request, response: Response, next: NextFunction) => {
	handler(request, response, next).catch(next);
};
