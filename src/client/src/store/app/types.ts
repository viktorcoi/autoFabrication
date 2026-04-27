import { ColorSchemeType } from "@vkontakte/vkui";
import {
    GetAuthMeResponse,
    GuidePermissionFlagsType,
    RolePermissionFlagsType,
    UserPermissionFlagsType
} from "@/apiService/apiAuth/types";

type NamePermission = '/users' | '/roles' | '/guide';

export type AppStore = {
    user: Omit<GetAuthMeResponse, 'role'> | null;
    role: Omit<GetAuthMeResponse['role'], 'permissions'> | null;
    permissions: Map<NamePermission, RolePermissionFlagsType | UserPermissionFlagsType | GuidePermissionFlagsType>;
    appReady: boolean;
    theme: ColorSchemeType;
    delaySearch: number;
    // TODO - (PERMISSIONS/ACCESS/ДОСТУП) dev режим защиты
    TEST: boolean,
    toggleTEST(): void;

    setDelaySearch(delay: number): void;
    setUser(user: GetAuthMeResponse | null): void;
    initializeApp(): void;
    toggleTheme(): void;
    getUser(): Promise<void>;
};
