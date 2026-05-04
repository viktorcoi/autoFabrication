import { create } from 'zustand';
import {SnackbarPlacementType, SnackbarStore} from "@/store/snackbar/types";

const SNACKBAR_STORAGE_KEY = 'snackbarSettings';
const DEFAULT_SNACKBAR_SETTINGS = {
    placement: 'top-end' as SnackbarPlacementType,
    time: 5000,
    count: 3,
};

const SNACKBAR_PLACEMENTS: SnackbarPlacementType[] = ['top-start', 'top-end', 'bottom-start', 'bottom-end'];

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

const normalizeSnackbarSettings = (value: unknown) => {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        return DEFAULT_SNACKBAR_SETTINGS;
    }

    const settings = value as Partial<typeof DEFAULT_SNACKBAR_SETTINGS>;
    const placement = SNACKBAR_PLACEMENTS.includes(settings.placement as SnackbarPlacementType)
        ? settings.placement as SnackbarPlacementType
        : DEFAULT_SNACKBAR_SETTINGS.placement;
    const time = typeof settings.time === 'number' && Number.isFinite(settings.time)
        ? Math.min(60000, Math.max(1000, Math.round(settings.time)))
        : DEFAULT_SNACKBAR_SETTINGS.time;
    const count = typeof settings.count === 'number' && Number.isFinite(settings.count)
        ? Math.min(5, Math.max(1, Math.round(settings.count)))
        : DEFAULT_SNACKBAR_SETTINGS.count;

    return {placement, time, count};
};

const getStoredSnackbarSettings = () => {
    if (typeof window === 'undefined') {
        return DEFAULT_SNACKBAR_SETTINGS;
    }

    return normalizeSnackbarSettings(safeJsonParse<unknown>(
        window.localStorage.getItem(SNACKBAR_STORAGE_KEY),
        DEFAULT_SNACKBAR_SETTINGS,
    ));
};

const saveSnackbarSettings = (settings: typeof DEFAULT_SNACKBAR_SETTINGS) => {
    if (typeof window === 'undefined') {
        return;
    }

    try {
        window.localStorage.setItem(SNACKBAR_STORAGE_KEY, JSON.stringify(settings));
    } catch {
        // Ignore storage errors.
    }
};

const storedSettings = getStoredSnackbarSettings();

export const useSnackbarStore = create<SnackbarStore>((set) => ({
    snackbars: [],
    placement: storedSettings.placement,
    time: storedSettings.time,
    count: storedSettings.count,

    addSnackbar: (snackbar) => {
        let newId = 1;

        set((state) => {
            if (state.snackbars.length > 0) {
                const maxId = Math.max(...state.snackbars.map(s => s.id));
                newId = maxId + 1;
            }

            return {
                snackbars: [...state.snackbars, { ...snackbar, id: newId }],
            };
        });

        return newId;
    },

    changeCount: (count) => {
        const nextCount = Math.min(5, Math.max(1, Math.round(count)));

        set((state) => {
            saveSnackbarSettings({
                placement: state.placement,
                time: state.time,
                count: nextCount,
            });

            return {count: nextCount};
        });
    },

    changeTime: (time) => {
        const nextTime = Math.min(60000, Math.max(1000, Math.round(time)));

        set((state) => {
            saveSnackbarSettings({
                placement: state.placement,
                time: nextTime,
                count: state.count,
            });

            return {time: nextTime};
        });
    },

    changePlacement: (placement) => {
        set((state) => {
            saveSnackbarSettings({
                placement,
                time: state.time,
                count: state.count,
            });

            return {placement};
        });
    },

    removeSnackbar: (id) => {
        set((state) => ({
            snackbars: state.snackbars.filter((s) => s.id !== id),
        }));
    },
}));
