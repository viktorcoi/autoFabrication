export type RolePermissionFlags = {
	view: boolean;
	adding: boolean;
	changeAccess: boolean;
	editing: boolean;
	removing: boolean;
};

export type UserPermissionFlags = {
	view: boolean;
	adding: boolean;
	editing: boolean;
	resetPassword: boolean;
	removing: boolean;
};

export type GuidePermissionFlags = {
	view: boolean;
	adding: boolean;
	editing: boolean;
	removing: boolean;
};

export type RolePermissionItem = {
	url: "/roles";
	access: RolePermissionFlags;
};

export type UserPermissionItem = {
	url: "/users";
	access: UserPermissionFlags;
};

export type GuidePermissionItem = {
	url: "/guide";
	access: GuidePermissionFlags;
};

export type RolePermissions = {
	1: RolePermissionItem;
	2: UserPermissionItem;
	3: GuidePermissionItem;
};

export type PermissionItem = RolePermissions[keyof RolePermissions];

export type PermissionUrl = PermissionItem["url"];

export type PermissionItemByUrl<TUrl extends PermissionUrl> = Extract<
	PermissionItem,
	{ url: TUrl }
>;

export type PermissionAction<TUrl extends PermissionUrl> = keyof PermissionItemByUrl<TUrl>["access"];

export const defaultRolePermissions: RolePermissions = {
	1: {
		url: "/roles",
		access: {
			view: false,
			adding: false,
			changeAccess: false,
			editing: false,
			removing: false,
		},
	},
	2: {
		url: "/users",
		access: {
			view: false,
			adding: false,
			editing: false,
			resetPassword: false,
			removing: false,
		},
	},
	3: {
		url: "/guide",
		access: {
			view: false,
			adding: false,
			editing: false,
			removing: false,
		},
	},
};

export const adminPermissions: RolePermissions = {
	1: {
		url: "/roles",
		access: {
			view: true,
			adding: true,
			changeAccess: true,
			editing: true,
			removing: true,
		},
	},
	2: {
		url: "/users",
		access: {
			view: true,
			adding: true,
			editing: true,
			resetPassword: true,
			removing: true,
		},
	},
	3: {
		url: "/guide",
		access: {
			view: true,
			adding: true,
			editing: true,
			removing: true,
		},
	},
};
