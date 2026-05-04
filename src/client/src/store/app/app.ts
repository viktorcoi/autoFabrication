import { create } from "zustand";
import {AppStore, PageStorageSettings, StorageSettings} from "@/store/app/types";
import {ColorSchemeType} from "@vkontakte/vkui";
import {ApiService} from "@/apiService/apiService";
import {GetAuthMeResponse} from "@/apiService/apiAuth/types";
import {allUrl} from "@/shared/navigations";

const THEME_STORAGE_KEY = "theme";
const STORAGE_SETTINGS_KEY = "storageSettings";
const PAGE_STORAGE_KEY = "pageStorage";

const DEFAULT_STORAGE_SETTINGS: StorageSettings = {
    saveSearch: false,
    saveFilters: true,
    saveTableSettings: true,
    saveTableRows: true,
};

const autoDetectAppearance = (): 'dark' | 'light' => {
    if (typeof window !== 'undefined' && window.matchMedia) {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
};

const safeJsonParse = <T, >(value: string | null, fallback: T): T => {
    if (!value) {
        return fallback;
    }

    try {
        return JSON.parse(value) as T;
    } catch {
        return fallback;
    }
};

const getStoredStorageSettings = (): StorageSettings => {
    if (typeof window === "undefined") {
        return DEFAULT_STORAGE_SETTINGS;
    }

    const storedSettings = safeJsonParse<Partial<StorageSettings>>(
        window.localStorage.getItem(STORAGE_SETTINGS_KEY),
        {},
    );

    return {
        saveSearch: typeof storedSettings.saveSearch === "boolean"
            ? storedSettings.saveSearch
            : DEFAULT_STORAGE_SETTINGS.saveSearch,
        saveFilters: typeof storedSettings.saveFilters === "boolean"
            ? storedSettings.saveFilters
            : DEFAULT_STORAGE_SETTINGS.saveFilters,
        saveTableSettings: typeof storedSettings.saveTableSettings === "boolean"
            ? storedSettings.saveTableSettings
            : DEFAULT_STORAGE_SETTINGS.saveTableSettings,
        saveTableRows: typeof storedSettings.saveTableRows === "boolean"
            ? storedSettings.saveTableRows
            : DEFAULT_STORAGE_SETTINGS.saveTableRows,
    };
};

const saveStorageSettings = (settings: StorageSettings) => {
    if (typeof window === "undefined") {
        return;
    }

    try {
        window.localStorage.setItem(STORAGE_SETTINGS_KEY, JSON.stringify(settings));
    } catch {
        // Ignore storage errors.
    }
};

const getStoredPageSettings = (): Record<string, PageStorageSettings> => {
    if (typeof window === "undefined") {
        return {};
    }

    const value = safeJsonParse<unknown>(window.localStorage.getItem(PAGE_STORAGE_KEY), {});

    if (!value || typeof value !== "object" || Array.isArray(value)) {
        return {};
    }

    return Object.entries(value).reduce<Record<string, PageStorageSettings>>((result, [key, settings]) => {
        if (!settings || typeof settings !== "object" || Array.isArray(settings)) {
            return result;
        }

        result[key] = settings as PageStorageSettings;
        return result;
    }, {});
};

const savePageSettings = (settings: Record<string, PageStorageSettings>) => {
    if (typeof window === "undefined") {
        return;
    }

    try {
        window.localStorage.setItem(PAGE_STORAGE_KEY, JSON.stringify(settings));
    } catch {
        // Ignore storage errors.
    }
};

const parseUser = (user: GetAuthMeResponse) => {
    const { role, ...me } = user;
    const {permissions, ...restRole} = role;

    const permissionsMap = new Map();

    Object.values(permissions).forEach(({url, access}) => {
        permissionsMap.set(url, access);
    });

    const newNav = allUrl.filter((nav) => permissionsMap.get(nav.url)?.view);

    const separatorAnchorIndex = newNav.length > 1
        ? newNav.findIndex(({url}) => url === '/users')
        : -1;

    const fallbackSeparatorAnchorIndex = newNav.length > 1 && separatorAnchorIndex === -1
        ? newNav.findIndex(({url}) => url === '/roles')
        : -1;

    const resolvedSeparatorAnchorIndex = separatorAnchorIndex !== -1
        ? separatorAnchorIndex
        : fallbackSeparatorAnchorIndex;

    if (resolvedSeparatorAnchorIndex !== -1) {
        newNav.splice(resolvedSeparatorAnchorIndex + 1, 0, {
            name: 'separator',
            icon: null,
            url: ''
        });
    }

    return {
        user: me,
        role: restRole,
        permissions: permissionsMap,
        navigations: newNav,
    }
}

export const useAppStore = create<AppStore>((
    set,
    get
) => ({
    user: null,
    role: null,
    appReady: false,
    theme: "light",
    delaySearch: 500,
    storageSettings: DEFAULT_STORAGE_SETTINGS,
    permissions: new Map(),
    navigations: [],
    // TODO - (PERMISSIONS/ACCESS/ДОСТУП) dev режим защиты
    TEST: true,
    toggleTEST: () => {
        set({TEST: !get().TEST})
    },

    initializeApp: () => {
        if (get().appReady || typeof window === "undefined") {
            return;
        }

        let theme = localStorage.getItem(THEME_STORAGE_KEY);

        if (theme !== 'dark' && theme !== 'light') {
            theme = autoDetectAppearance();
        }

        set({
            theme: theme as ColorSchemeType,
            storageSettings: getStoredStorageSettings(),
            appReady: true,
        });
    },

    getUser: async () => {
        await ApiService.auth.me({}).then(({status, data}) => {
            if (status === 'success') {
                const {
                    user,
                    role,
                    permissions,
                    navigations
                } = parseUser(data);

                set({ user, role, navigations, permissions });
            } else set({ user: null, role: null });
        })
    },

    setUser: (data) => {
        if (data !== null) {
            const {
                user,
                role,
                permissions,
                navigations
            } = parseUser(data);

            set({ user, role, navigations, permissions });
        } else set({ user: data, role: null });
    },

    toggleTheme: () => {
        const nextTheme = get().theme === "light" ? "dark" : "light";

        set({ theme: nextTheme });
        localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
    },

    setDelaySearch: (delay: number) => {
        set({ delaySearch: delay });
    },

    setStorageSetting: (key, value) => {
        const nextSettings = {
            ...get().storageSettings,
            [key]: value,
        };

        set({storageSettings: nextSettings});
        saveStorageSettings(nextSettings);
    },

    getPageStorage: <T extends PageStorageSettings>(pageKey: string): T => {
        if (!pageKey) {
            return {} as T;
        }

        return (getStoredPageSettings()[pageKey] ?? {}) as T;
    },

    setPageStorage: <T extends PageStorageSettings>(pageKey: string, value: Partial<T>) => {
        if (!pageKey) {
            return;
        }

        const currentSettings = getStoredPageSettings();
        currentSettings[pageKey] = {
            ...currentSettings[pageKey],
            ...value,
        };
        savePageSettings(currentSettings);
    },
}));
