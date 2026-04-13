import { Router } from "express";
import { authRouter } from "../modules/auth/auth.router.js";
import { roleRouter } from "../modules/roles/role.router.js";
import { userRouter } from "../modules/users/user.router.js";
import { requireAuth } from "../shared/http/auth.js";

export const apiRouter = Router();

apiRouter.get("/", (_request, response) => {
	response.json({
		message: "REST API ready",
		modules: ["auth", "users", "roles", "files"],
	});
});

apiRouter.use("/auth", authRouter);
apiRouter.use("/roles", (request, _response, next) => {
	requireAuth(request);
	next();
});
apiRouter.use("/users", (request, _response, next) => {
	requireAuth(request);
	next();
});

apiRouter.use("/roles", roleRouter);
apiRouter.use("/users", userRouter);
