import type { NextFunction, Request, RequestHandler, Response } from "express";
import type { Prisma } from "../../generated/prisma/client.js";
import { prisma } from "../../lib/prisma.js";
import type {
	PermissionAction,
	PermissionItemByUrl,
	PermissionUrl,
	RolePermissions,
} from "../../modules/roles/role.types.js";
import { AppError } from "../errors/app-error.js";
import { requireAuth } from "./auth.js";

const ACCESS_DENIED_MESSAGE = "У вас отсутствует доступ для данного действия";

const rolePermissionsSelect = {
	role: {
		select: {
			permissions: true,
		},
	},
} satisfies Prisma.UserSelect;

type RequestWithPermissions = Request & {
	rolePermissions?: RolePermissions;
};

const getPermissionByUrl = <TUrl extends PermissionUrl>(
	permissions: RolePermissions,
	url: TUrl,
) => {
	return Object.values(permissions).find(
		(permission): permission is PermissionItemByUrl<TUrl> => permission.url === url,
	);
};

const assertPermission = <TUrl extends PermissionUrl>(
	permissions: RolePermissions,
	url: TUrl,
	action: PermissionAction<TUrl>,
) => {
	const permission = getPermissionByUrl(permissions, url);

	if (!permission?.access.view) {
		throw new AppError(403, ACCESS_DENIED_MESSAGE);
	}

	const access = permission.access as Record<string, boolean>;

	if (action !== "view" && !access[action as string]) {
		throw new AppError(403, ACCESS_DENIED_MESSAGE);
	}
};

const loadRolePermissions = async (request: Request, response: Response) => {
	const auth = requireAuth(request, response);
	const requestWithPermissions = request as RequestWithPermissions;

	if (requestWithPermissions.rolePermissions) {
		return requestWithPermissions.rolePermissions;
	}

	const user = await prisma.user.findUnique({
		where: {
			id: auth.userId,
		},
		select: rolePermissionsSelect,
	});

	if (!user) {
		throw new AppError(404, "Пользователь не найден");
	}

	requestWithPermissions.rolePermissions = user.role.permissions as RolePermissions;

	return requestWithPermissions.rolePermissions;
};

export const requirePermission = <TUrl extends PermissionUrl>(
	url: TUrl,
	action: PermissionAction<TUrl>,
): RequestHandler => {
	return async (request: Request, response: Response, next: NextFunction) => {
		try {
			const permissions = await loadRolePermissions(request, response);

			assertPermission(permissions, url, action);
			next();
		} catch (error) {
			next(error);
		}
	};
};
