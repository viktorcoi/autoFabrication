import cors from "cors";
import express from "express";
import helmet from "helmet";
import { pinoHttp } from "pino-http";
import { env } from "../config/env.js";
import { apiRouter } from "../routes/api.js";
import { errorHandler } from "../shared/http/error-handler.js";

export const createApp = () => {
	const app = express();
	const isProduction = process.env.NODE_ENV === "production";

	app.use(
		cors({
			origin: isProduction ? env.CLIENT_URL : true,
			credentials: true,
		}),
	);
	app.use(helmet());
	app.use(express.json({ limit: "2mb" }));
	app.use(
		"/storage",
		express.static(env.UPLOAD_DIR, {
			setHeaders: (response) => {
				response.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
			},
		}),
	);
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
