import {TableRow} from "@/components/Table/types";

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
	middleName?: string;
	avatarUrl?: string | null;
	birthDate: Date;
	login: string;
	password: string;
}

export interface PathUserOptions {
	roleId?: number;
	firstName?: string;
	lastName?: string;
	middleName?: string;
	avatarUrl?: string | null;
	birthDate?: Date;
	login?: string;
	password?: string;
}
