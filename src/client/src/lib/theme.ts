export const COLOR_SCHEME_COOKIE = "vkui-color-scheme";

export type AppColorScheme = "light" | "dark";

export const isAppColorScheme = (value: string | undefined): value is AppColorScheme =>
	value === "light" || value === "dark";
