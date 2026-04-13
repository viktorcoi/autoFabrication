"use client";

import {SubmitEvent, useState} from "react";
import { useRouter } from "next/navigation";
import {Button, FormItem, FormStatus, IconButton, Input, Title, useColorScheme} from "@vkontakte/vkui";
import { useAuthStore } from "@/store/auth";
import styles from "./page.module.scss";
import {ApiService} from "@/lib/apiService/apiService";
import {Icon20MoonOutline, Icon20SunOutline} from "@vkontakte/icons";

const LoginPage = () => {
	const router = useRouter();
	const setUser = useAuthStore((state) => state.setUser);
	const [login, setLogin] = useState("");
	const [password, setPassword] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const colorScheme = useColorScheme();

	const handleSubmit = async (event: SubmitEvent<HTMLFormElement>) => {
		event.preventDefault();
		setLoading(true);

		await ApiService.auth.login(
			{
				login,
				password,
				errorOptions: { show: false },
			},
		).then(({status, data}) => {
			if (status === "success") {
				setUser(data);
				router.replace("/");
			} else setError(data);
		}).finally(() => setLoading(false));
	};

	return (
		<div className={styles.wrap}>
			<div className={styles.card}>
				<div className={styles.header}>
					<Title>Авторизация</Title>
					<IconButton label={'Сменить тему'}>
						{colorScheme === 'dark' ? <Icon20SunOutline width={24} height={24} /> : <Icon20MoonOutline width={24} height={24} />}
					</IconButton>
				</div>
				<form
					className={styles.form}
					onSubmit={handleSubmit}
				>
					{!!error.trim() && <FormStatus mode={'error'}>{error}</FormStatus>}
					<FormItem
						noPadding={true}
						top={'Логин'}
					>
						<Input
							value={login}
							onChange={(event) => setLogin(event.target.value)}
							placeholder={'Введите логин'}
						/>
					</FormItem>
					<FormItem
						noPadding={true}
						top={'Пароль'}
					>
						<Input
							type={'password'}
							value={password}
							onChange={(event) => setPassword(event.target.value)}
							placeholder={'Введите пароль'}
						/>
					</FormItem>
					<Button
						className={styles.button}
						type={'submit'}
						size={'l'}
						loading={loading}
						stretched={true}
					>
						Войти
					</Button>
				</form>
			</div>
		</div>
	);
};

export default LoginPage;
