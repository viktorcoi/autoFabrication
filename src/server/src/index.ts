import { mkdir } from "node:fs/promises";
import { createApp } from "./app/create-app.js";
import { env } from "./config/env.js";

const bootstrap = async () => {
	await mkdir(env.UPLOAD_DIR, { recursive: true });

	const app = createApp();

	app.listen(env.PORT, "0.0.0.0", () => {
		console.log(`Server started on http://0.0.0.0:${env.PORT}`);
	});
};

bootstrap().catch((error: unknown) => {
	console.error("Ошибка запуска сервера", error);
	process.exit(1);
});
