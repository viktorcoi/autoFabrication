import type {TableSorting} from "@/components/Table/types";

export type RolePermissionFlagsType = {
    view: boolean;
    adding: boolean;
    changeAccess: boolean;
    editing: boolean;
    removing: boolean;
}

export type UserPermissionFlagsType = {
    view: boolean;
    adding: boolean;
    editing: boolean;
    resetPassword: boolean;
    removing: boolean;
}

export type GuidePermissionFlagsType = {
    view: boolean;
    adding: boolean;
    editing: boolean;
    removing: boolean;
}

export type ProductsPermissionFlagsType = {
    view: boolean;
    adding: boolean;
    editing: boolean;
    removing: boolean;
    viewProcess: boolean;
    addingProcess: boolean;
    editingProcess: boolean;
    removingProcess: boolean;
    changeDisabledProcess: boolean;
}

type RolePermissionType = {
    url: '/roles';
    access: RolePermissionFlagsType;
}

type UserPermissionType = {
    url: '/users';
    access: UserPermissionFlagsType;
}

type GuidePermissionType = {
    url: '/guide';
    access: GuidePermissionFlagsType;
}

type ProductsPermissionType = {
    url: '/products';
    access: ProductsPermissionFlagsType;
}

export type RolePermissionsType = {
    1: RolePermissionType;
    2: UserPermissionType;
    3: GuidePermissionType;
    4: ProductsPermissionType;
}

export type RolePermissionSection = RolePermissionsType[keyof RolePermissionsType];

export interface GetByIdRoleResponse {
    id: number,
    name: string,
    description: string,
    isAdmin: boolean,
    permissions: RolePermissionsType;
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
    sorting?: TableSorting;
}

export interface PostRolesOptions {
    name: string,
    description: string,
}

export interface PatchRolePermissionsOptions {
    permissions: RolePermissionsType;
}
