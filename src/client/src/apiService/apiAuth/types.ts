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

export type RolePermissionsType = {
    1: RolePermissionType;
    2: UserPermissionType;
    3: GuidePermissionType;
}

export type GetAuthMeResponse = {
    id: number;
    firstName: string;
    lastName: string;
    birthDate: Date;
    middleName: string | null;
    login: string;
    avatarUrl: string | null;
    isAdmin: boolean;
    roleId: number;
    createdAt: string;
    updatedAt: string;
    role: {
        id: number;
        name: string;
        description: string | null;
        permissions: RolePermissionsType;
    };
    mainUrl: string;
}

export type ChangePasswordOptions = {
    oldPassword: string;
    newPassword: string;
};
