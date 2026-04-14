import { ColorSchemeType } from "@vkontakte/vkui";
import type {GetAuthMeResponse} from "@/apiService/apiAuth/types";

export type AppStore = {
    user: Omit<GetAuthMeResponse, 'role'> | null;
    role: GetAuthMeResponse['role'] | null;
    appReady: boolean;
    theme: ColorSchemeType;
    setUser(user: GetAuthMeResponse | null): void;
    initializeApp(): void;
    toggleTheme(): void;
};
