import cors from "cors";
import express from "express";
import helmet from "helmet";
import { pinoHttp } from "pino-http";
import { env } from "../config/env.js";
import { apiRouter } from "../routes/api.js";
import { errorHandler } from "../shared/http/error-handler.js";

export const createApp = () => {
	const app = express();

	app.use(
		cors({
			origin: env.CLIENT_URL,
			credentials: true,
		}),
	);
	app.use(helmet());
	app.use(express.json({ limit: "2mb" }));
	app.use(
		pinoHttp({
			quietReqLogger: true,
		}),
	);

	app.get("/health", (_request, response) => {
		response.json({
			ok: true,
			service: "autoFabrication-server",
		});
	});

	app.use("/api", apiRouter);

	app.use((_request, response) => {
		response.status(404).json({
			message: "Маршрут не найден",
		});
	});

	app.use(errorHandler);

	return app;
};
