import { create } from "zustand";
import { AppStore } from "@/store/app/types";
import {ColorSchemeType} from "@vkontakte/vkui";

const THEME_STORAGE_KEY = "theme";

const autoDetectAppearance = (): 'dark' | 'light' => {
    if (typeof window !== 'undefined' && window.matchMedia) {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
};

export const useAppStore = create<AppStore>((
    set,
    get
) => ({
    user: null,
    role: null,
    appReady: false,
    theme: "light",

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

    setUser: (user) => {
        if (user !== null) {
            const { role, ...me } = user;
            set({ user: me, role });
        } else set({ user, role: null });
    },

    toggleTheme: () => {
        const nextTheme = get().theme === "light" ? "dark" : "light";

        set({ theme: nextTheme });
        localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
    },
}));
