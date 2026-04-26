export type RolePermissionFlags = {
    view: boolean;
    adding: boolean;
    changeAccess: boolean;
    editing: boolean;
    removing: boolean;
}

export type UserPermissionFlags = {
    view: boolean;
    adding: boolean;
    editing: boolean;
    resetPassword: boolean;
    removing: boolean;
}

export type GuidePermissionFlags = {
    view: boolean;
    adding: boolean;
    editing: boolean;
    removing: boolean;
}

export type RolePermissionItem = {
    url: '/roles';
    access: RolePermissionFlags;
}

export type UserPermissionItem = {
    url: '/users';
    access: UserPermissionFlags;
}

export type GuidePermissionItem = {
    url: '/guide';
    access: GuidePermissionFlags;
}

export type RolePermissions = {
    1: RolePermissionItem;
    2: UserPermissionItem;
    3: GuidePermissionItem;
}

export type RolePermissionSection = RolePermissions[keyof RolePermissions];

export interface GetByIdRoleResponse {
    id: number,
    name: string,
    description: string,
    isAdmin: boolean,
    permissions: RolePermissions;
    createdAt: string,
    updatedAt: string,
    _count: {
        users: number
    }
}

export interface GetRolesResponse {
    id: number,
    name: string,
    isAdmin: boolean,
    _count: {
        users: number
    }
}

export interface GetRolesOptions {
    search?: string;
    forSelect?: boolean;
}

export interface PostRolesOptions {
    name: string,
    description: string,
}

export interface PatchRolePermissionsOptions {
    permissions: RolePermissions;
}
