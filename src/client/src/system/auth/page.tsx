import { SubmitEvent, useState } from "react";
import { useRouter } from "next/navigation";
import {
	Button,
	FormItem,
	IconButton,
	Input,
	Title,
	Tooltip,
} from "@vkontakte/vkui";
import { ApiService } from "@/apiService/apiService";
import { Icon20MoonOutline, Icon20SunOutline } from "@vkontakte/icons";
import { useAppStore } from "@/store/app/app";
import styles from "./page.module.scss";
import PasswordInput from "@/components/PasswordInput/PasswordInput";
import { useSnackbarStore } from "@/store/snackbar/snackbar";

const LOGIN_PATTERN = /^[\x21-\x7E]+$/;

const LoginPage = () => {
	const router = useRouter();

	const addSnackbar = useSnackbarStore((state) => state.addSnackbar);
	const {
		theme,
		setUser,
		toggleTheme
	} = useAppStore((state) => state);

	const [login, setLogin] = useState("");
	const [password, setPassword] = useState("");
	const [loading, setLoading] = useState(false);
	const [wasError, setWasError] = useState(false);

	const handleSubmit = async (event: SubmitEvent<HTMLFormElement>) => {
		event.preventDefault();

		const normalizedLogin = login.trim();
		const normalizedPassword = password.trim();

		if (!normalizedLogin || !normalizedPassword) {
			return;
		}

		if (normalizedLogin.length < 5) {
			addSnackbar({
				type: "error",
				text: "Логин должен содержать не менее 5 латинских символов.",
			});
			setWasError(true);
			return;
		}

		if (!LOGIN_PATTERN.test(normalizedLogin)) {
			addSnackbar({
				type: "error",
				text: "Логин может содержать только латинские буквы, цифры и специальные символы.",
			});
			setWasError(true);
			return;
		}

		if (normalizedPassword.length < 6) {
			addSnackbar({
				type: "error",
				text: "Пароль должен содержать не менее 6 символов.",
			});
			setWasError(true);
			return;
		}

		setLoading(true);

		await ApiService.auth.login({
			login: normalizedLogin,
			password: normalizedPassword,
		}).then(({ status, data }) => {
			if (status === "success") {
				setUser(data);
			} else setWasError(true);
		}).finally(() => setLoading(false));
	};

	return (
		<div className={styles.wrap}>
			<div className={styles.card}>
				<div className={styles.header}>
					<Title>Авторизация</Title>
					<Tooltip
						description={`${theme === "dark" ? "Светлая" : "Темная"} тема`}
						usePortal={true}
						placement={"top"}
					>
						<IconButton label={"Сменить тему"} onClick={toggleTheme}>
							{theme === "dark" ? (
								<Icon20SunOutline width={24} height={24} />
							) : (
								<Icon20MoonOutline width={24} height={24} />
							)}
						</IconButton>
					</Tooltip>
				</div>
				<form className={styles.form} onSubmit={handleSubmit}>
					<FormItem noPadding={true} top={"Логин"}>
						<Input
							disabled={loading}
							value={login}
							onChange={(event) => {
								if (wasError) setWasError(false);
								setLogin(event.target.value)
							}}
							placeholder={"Введите логин"}
						/>
					</FormItem>
					<FormItem noPadding={true} top={"Пароль"}>
						<PasswordInput
							disabled={loading}
							value={password}
							onChange={(event) => {
								if (wasError) setWasError(false);
								setPassword(event.target.value)
							}}
						/>
					</FormItem>
					<Button
						disabled={!login.trim() || !password.trim() || wasError}
						className={styles.button}
						type={"submit"}
						size={"l"}
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
