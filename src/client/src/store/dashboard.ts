import { create } from "zustand";

type DemoUser = {
	id: string;
	login: string;
	name: string;
	role: string;
	status: string;
};

type DashboardState = {
	users: DemoUser[];
};

export const useDashboardStore = create<DashboardState>(() => ({
	users: [
		{
			id: "1",
			login: "admin",
			name: "Главный администратор",
			role: "ADMIN",
			status: "Активен",
		},
		{
			id: "2",
			login: "operator",
			name: "Оператор участка",
			role: "OPERATOR",
			status: "Ожидает API",
		},
	],
}));
