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

const findPermissionByPath = (permissions: RolePermissions, path: string) =>
	Object.values(permissions).find((permission) => permission.url === path);

const getPermissionByUrl = <TUrl extends PermissionUrl>(
	permissions: RolePermissions,
	url: TUrl,
) => {
	return Object.values(permissions).find(
		(permission): permission is PermissionItemByUrl<TUrl> => permission.url === url,
	);
};

export const hasAccessibleRoute = (permissions: RolePermissions) =>
	Object.values(permissions).some((permissionGroup) => permissionGroup.access.view);

export const getMainUrl = (permissions: RolePermissions) => {
	for (const permissionGroup of Object.values(permissions)) {
		if (permissionGroup.access.view) {
			return permissionGroup.url;
		}
	}

	return "";
};

export const normalizePermissionPath = (path: string) => {
	const [firstSegment] = path
		.trim()
		.split("/")
		.filter(Boolean);

	return firstSegment ? `/${firstSegment}` : "/";
};

export const isPermissionRoute = (permissions: RolePermissions, path: string): path is PermissionUrl =>
	Boolean(findPermissionByPath(permissions, path));

export const hasPermission = <TUrl extends PermissionUrl>(
	permissions: RolePermissions,
	url: TUrl,
	action: PermissionAction<TUrl>,
) => {
	const permission = getPermissionByUrl(permissions, url);

	if (!permission?.access.view) {
		return false;
	}

	const access = permission.access as Record<string, boolean>;

	if (action !== "view" && !access[action as string]) {
		return false;
	}

	return true;
};

export const assertPermission = <TUrl extends PermissionUrl>(
	permissions: RolePermissions,
	url: TUrl,
	action: PermissionAction<TUrl>,
) => {
	if (!hasPermission(permissions, url, action)) {
		throw new AppError(403, ACCESS_DENIED_MESSAGE);
	}
};

export const loadRolePermissions = async (request: Request, response: Response) => {
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
