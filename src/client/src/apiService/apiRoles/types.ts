export interface GetRolesResponse {
    id: number,
    name: string,
    description: string,
    permissions: Record<string, unknown>;
    createdAt: string,
    updatedAt: string,
    _count: {
        users: number
    }
}
