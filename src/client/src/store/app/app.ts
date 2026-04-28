import { create } from "zustand";
import {AppStore} from "@/store/app/types";
import {ColorSchemeType} from "@vkontakte/vkui";
import {ApiService} from "@/apiService/apiService";
import {GetAuthMeResponse} from "@/apiService/apiAuth/types";
import {allUrl} from "@/shared/navigations";

const THEME_STORAGE_KEY = "theme";

const autoDetectAppearance = (): 'dark' | 'light' => {
    if (typeof window !== 'undefined' && window.matchMedia) {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
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
    }
}));
