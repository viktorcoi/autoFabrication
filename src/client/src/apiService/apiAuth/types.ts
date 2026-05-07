import {RolePermissionsType} from "@/apiService/apiRoles/types";

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
