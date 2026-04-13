"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Group, Panel, PanelHeader, SimpleCell, SplitCol, SplitLayout, Spinner, Text } from "@vkontakte/vkui";
import Table from "@/components/Table/Table";
// import { logoutRequest, meRequest } from "@/lib/auth";
import { useDashboardStore } from "@/store/dashboard";
import styles from "./DashboardPage.module.scss";
import {ApiService} from "@/lib/apiService/apiService";

const columns = [
	{ key: "login", header: "Логин", size: 220 },
	{ key: "name", header: "Имя", size: 240 },
	{ key: "role", header: "Роль", size: 180 },
	{ key: "status", header: "Статус", size: 160 },
];

const DashboardPage = () => {
	const router = useRouter();
	const users = useDashboardStore((state) => state.users);
	const [loading, setLoading] = useState(true);
	const [userInfo, setUserInfo] = useState<{
		fullName: string;
		login: string;
		role: string;
	} | null>(null);

	useEffect(() => {
		const load = async () => {
			await ApiService.auth.me({}).then(({status, data}) => {
				if (status === 'success') {
					const fullName = [data.lastName, data.firstName, data.middleName].filter(Boolean).join(" ");
					setUserInfo({
						fullName,
						login: data.login,
						role: data.role.name,
					});
				} else router.replace("/auth");
			})
		};

		load().finally(() => setLoading(false));
	}, [router]);

	const handleLogout = async () => {
		ApiService.auth.logout({}).then(({status, data}) => {
			console.log(data);
			if (status === 'success') {
				router.replace("/auth");
			}
		});
	};

	if (loading) {
		return (
			<div className={styles.loader}>
				<Spinner size="l" />
			</div>
		);
	}

	return (
		<SplitLayout header={<PanelHeader>autoFabrication</PanelHeader>}>
			<SplitCol autoSpaced>
				<Panel>
					<div className={styles.page}>
						<section className={styles.hero}>
							<Text className={styles.caption}>Локальная система управления производством</Text>
							<h1 className={styles.title}>Вы авторизованы и можете работать в системе.</h1>
							{userInfo ? (
								<div className={styles.userInfo}>
									<Text>Пользователь: {userInfo.fullName}</Text>
									<Text>Логин: {userInfo.login}</Text>
									<Text>Роль: {userInfo.role}</Text>
								</div>
							) : null}
							<Button mode="secondary"
									onClick={handleLogout}
							>
								Выйти
							</Button>
						</section>

						<div className={styles.grid}>
							<Group className={styles.card} header={<PanelHeader>Статус проекта</PanelHeader>}>
								<SimpleCell subtitle="Next.js 16 + VKUI + SCSS Modules">Клиент готов</SimpleCell>
								<SimpleCell subtitle="Express + Prisma + TypeScript">Сервер готов</SimpleCell>
								<SimpleCell subtitle="JWT + cookie">Авторизация готова</SimpleCell>
							</Group>

							<div className={styles.tableWrap}>
								<Table
									componentName="users-demo"
									data={users}
									columns={columns}
									total={users.length}
									page={0}
									pageSize={25}
									onEvent={() => undefined}
									emptyState={{
										title: "Пользователи пока не добавлены",
										description: "Следующий шаг: подключить реальные данные из API.",
									}}
								/>
							</div>
						</div>
					</div>
				</Panel>
			</SplitCol>
		</SplitLayout>
	);
};

export default DashboardPage;
