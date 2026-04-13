"use client";

import { useState } from "react";
import { AdaptivityProvider, AppRoot, ConfigProvider } from "@vkontakte/vkui";
import "@vkontakte/vkui/dist/vkui.css";
import { PropsWithChildren } from "react";
import { isAppColorScheme, type AppColorScheme } from "@/lib/theme";
import SnackbarProvider from "@/components/SnackbarProvider/SnackbarProvider";

type ProvidersProps = PropsWithChildren<{
	initialColorScheme: AppColorScheme;
}>;

const Providers = ({ children, initialColorScheme }: ProvidersProps) => {
	const [colorScheme] = useState<AppColorScheme>(() => {
		if (typeof document === "undefined") {
			return initialColorScheme;
		}

		const nextColorScheme = document.documentElement.dataset.colorScheme;
		return isAppColorScheme(nextColorScheme) ? nextColorScheme : initialColorScheme;
	});

	return (
		<ConfigProvider colorScheme={colorScheme}>
			<AdaptivityProvider>
				<AppRoot disableSettingVKUIClassesInRuntime>
					<SnackbarProvider>
						{children}
					</SnackbarProvider>
				</AppRoot>
			</AdaptivityProvider>
		</ConfigProvider>
	);
};

export default Providers;
