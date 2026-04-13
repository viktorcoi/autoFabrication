import type { Metadata } from "next";
import { cookies } from "next/headers";
import Script from "next/script";
import { PropsWithChildren } from "react";
import { COLOR_SCHEME_COOKIE, isAppColorScheme, type AppColorScheme } from "@/lib/theme";
import Providers from "./providers";
import "./globals.scss";

export const metadata: Metadata = {
	title: "autoFabrication",
	description: "Система автоматизации производственных процессов",
};

const RootLayout = async ({ children }: PropsWithChildren) => {
	const cookieStore = await cookies();
	const colorSchemeCookie = cookieStore.get(COLOR_SCHEME_COOKIE)?.value;
	const initialColorScheme: AppColorScheme = isAppColorScheme(colorSchemeCookie) ? colorSchemeCookie : "light";

	return (
		<html
			lang="ru"
			className="vkui"
			data-color-scheme={initialColorScheme}
			suppressHydrationWarning
		>
			<body className="vkui__root">
				<Script id="vkui-theme-init" strategy="beforeInteractive">
					{`
						(function () {
							var cookieName = "${COLOR_SCHEME_COOKIE}";
							var match = document.cookie.match(new RegExp("(?:^|; )" + cookieName + "=([^;]*)"));
							var cookieValue = match ? decodeURIComponent(match[1]) : "";
							var scheme = cookieValue === "dark" || cookieValue === "light"
								? cookieValue
								: (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
							document.documentElement.dataset.colorScheme = scheme;
							document.documentElement.style.colorScheme = scheme;
							document.cookie = cookieName + "=" + scheme + "; path=/; max-age=31536000; samesite=lax";
						})();
					`}
				</Script>
				<Providers initialColorScheme={initialColorScheme}>{children}</Providers>
			</body>
		</html>
	);
};

export default RootLayout;
