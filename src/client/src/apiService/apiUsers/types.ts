import {TableRow} from "@/components/Table/types";

export type UserAvatarValue = string | File | null;

export interface UserTableRow extends TableRow {
	id: number;
	login: string;
	lastName: string;
	firstName: string;
	middleName?: string;
	isAdmin: boolean;
	role: string;
	avatar?: string;
	birthDate: string;
}

export interface GetByIdUserResponse {
	id: number;
	firstName: string;
	lastName: string;
	middleName?: string;
	birthDate: Date;
	login: string;
	isAdmin: boolean;
	avatarUrl?: string;
	roleId: number;
	createdAt: string;
	updatedAt: string;
	role: {
		id: number;
		name: string;
		description?: string;
	};
}

export interface PostUserOptions {
	roleId: number;
	firstName: string;
	lastName: string;
	middleName?: string;
	avatarUrl?: UserAvatarValue;
	birthDate: Date;
	login: string;
	password: string;
}

export interface PathUserOptions {
	roleId?: number;
	firstName?: string;
	lastName?: string;
	middleName?: string;
	avatarUrl?: UserAvatarValue;
	birthDate?: Date;
	login?: string;
	password?: string;
}

export type PatchUsersTableOptions = Record<number, Partial<Pick<UserTableRow, "firstName" | "lastName" | "middleName" | "birthDate">>>;

export type GetUsersTableFilters = {
	roleId: number;
};
