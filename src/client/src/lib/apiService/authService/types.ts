export type UserInfo = {
    id: number;
    firstName: string;
    lastName: string;
    middleName: string | null;
    login: string;
    avatarUrl: string | null;
    roleId: number;
    createdAt: string;
    updatedAt: string;
    role: {
        id: number;
        name: string;
        description: string | null;
        permissions: Record<string, unknown>;
    };
}

export type PostAuthLoginResponse = {
    token: string;
    user: UserInfo;
};
