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

export interface PostUserOptions {
	role: number;
	firstName: string;
	lastName: string;
	middleName: string;
	birthDate: null | Date;
}
