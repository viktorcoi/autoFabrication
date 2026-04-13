export type PermissionFlags = {
	view: boolean;
	adding: boolean;
	changeAccess: boolean;
	editing: boolean;
	removing: boolean;
};

export type RolePermissions = Record<string, PermissionFlags>;

export const fullAccess: PermissionFlags = {
	view: true,
	adding: true,
	changeAccess: true,
	editing: true,
	removing: true,
};

export const adminPermissions: RolePermissions = {
	dashboard: fullAccess,
	users: fullAccess,
	roles: fullAccess,
	files: fullAccess,
	settings: fullAccess,
};
