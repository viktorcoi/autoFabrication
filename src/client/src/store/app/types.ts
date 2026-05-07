import { ColorSchemeType } from "@vkontakte/vkui";
import {
    GetAuthMeResponse,
} from "@/apiService/apiAuth/types";
import {ReactNode} from "react";
import {
    GuidePermissionFlagsType,
    ProductsPermissionFlagsType,
    RolePermissionFlagsType,
    UserPermissionFlagsType
} from "@/apiService/apiRoles/types";

type NamePermission = '/users' | '/roles' | '/guide' | '/products';

export type Navigate = {
    name: string;
    url: string;
    icon: ReactNode;
}

export type StorageSettings = {
    saveSearch: boolean;
    saveFilters: boolean;
    saveTableSettings: boolean;
    saveTableRows: boolean;
};

export type PageStorageSettings = {
    search?: string;
    filters?: unknown;
};

export type AppStore = {
    user: Omit<GetAuthMeResponse, 'role'> | null;
    role: Omit<GetAuthMeResponse['role'], 'permissions'> | null;
    permissions: Map<NamePermission, RolePermissionFlagsType | UserPermissionFlagsType | GuidePermissionFlagsType | ProductsPermissionFlagsType>;
    appReady: boolean;
    theme: ColorSchemeType;
    delaySearch: number;
    storageSettings: StorageSettings;
    navigations: Navigate[];
    // TODO - (PERMISSIONS/ACCESS/ДОСТУП) dev режим защиты
    TEST: boolean,
    toggleTEST(): void;

    setDelaySearch(delay: number): void;
    setStorageSetting(key: keyof StorageSettings, value: boolean): void;
    getPageStorage<T extends PageStorageSettings>(pageKey: string): T;
    setPageStorage<T extends PageStorageSettings>(pageKey: string, value: Partial<T>): void;
    setUser(user: GetAuthMeResponse | null): void;
    initializeApp(): void;
    toggleTheme(): void;
    getUser(): Promise<void>;
};
