import { Router } from "express";
import { authRouter } from "../modules/auth/auth.router.js";
import { guideRouter } from "../modules/guide/guide.router.js";
import { processOperationRouter } from "../modules/process-operations/process-operation.router.js";
import { processStepRouter } from "../modules/process-steps/process-step.router.js";
import { processWorkRouter } from "../modules/process-works/process-work.router.js";
import { processRouter } from "../modules/processes/process.router.js";
import { productRouter } from "../modules/products/product.router.js";
import { roleRouter } from "../modules/roles/role.router.js";
import { userRouter } from "../modules/users/user.router.js";

export const apiRouter = Router();

apiRouter.get("/", (_request, response) => {
	response.json({
		message: "REST API ready",
		modules: ["auth", "users", "roles", "guide", "products", "processes", "process-operations", "process-steps", "process-works"],
	});
});

apiRouter.use("/auth", authRouter);
apiRouter.use("/roles", roleRouter);
apiRouter.use("/users", userRouter);
apiRouter.use("/guide", guideRouter);
apiRouter.use("/products", productRouter);
apiRouter.use("/processes", processRouter);
apiRouter.use("/process-operations", processOperationRouter);
apiRouter.use("/process-steps", processStepRouter);
apiRouter.use("/process-works", processWorkRouter);
