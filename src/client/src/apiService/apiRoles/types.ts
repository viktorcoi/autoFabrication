export interface GetByIdRoleResponse {
    id: number,
    name: string,
    description: string,
    isConst: boolean,
    permissions: Record<string, unknown>;
    createdAt: string,
    updatedAt: string,
    _count: {
        users: number
    }
}

export interface GetRolesResponse {
    id: number,
    name: string,
    isConst: boolean,
    _count: {
        users: number
    }
}

export interface GetRolesOptions {
    search?: string;
}

export interface PostRolesOptions {
    name: string,
    description: string,
}
