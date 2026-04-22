import {TableRow} from "@/components/Table/types";

export type UserTableSorting = {
	id: 'id' | 'login' | 'lastName' | 'firstName' | 'middleName' | 'role' | 'avatar' | 'birthDate';
	sort: 'asc' | 'desc';
} | null;

export interface GetUsersTableOptions {
	page?: number;
	rows?: number;
	search?: string;
	sorting?: UserTableSorting;
}

export interface UserTableRow extends TableRow {
	id: number;
	login: string;
	lastName: string;
	firstName: string;
	middleName?: string;
	role: string;
	avatar?: string;
	birthDate: string;
}

export interface GetByIdUserResponse {
	id: number;
	firstName: string;
	lastName: string;
	middleName?: string;
	birthDate: string;
	login: string;
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
	middleName: string;
	birthDate: Date;
}

export interface CreateUserOptions {
	firstName: string;
	lastName: string;
	middleName?: string;
	birthDate: Date;
	login: string;
	password: string;
	avatarUrl?: string;
	roleId: number;
}
