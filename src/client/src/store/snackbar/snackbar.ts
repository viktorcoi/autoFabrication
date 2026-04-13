import { create } from 'zustand';
import { ReactNode } from 'react';

export type SnackbarType = 'success' | 'error' | 'warning' | 'info';

export type SnackbarItem = {
    id: number;
    text: ReactNode;
    type: SnackbarType;
    action?: ReactNode;
    onActionClick?(): void;
};

type SnackbarStore = {
    snackbars: SnackbarItem[];
    addSnackbar: (snackbar: Omit<SnackbarItem, 'id'>) => number;
    removeSnackbar: (id: number) => void;
};

export const useSnackbarStore = create<SnackbarStore>((set, get) => ({
    snackbars: [],

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

    removeSnackbar: (id) => {
        set((state) => ({
            snackbars: state.snackbars.filter((s) => s.id !== id),
        }));
    },
}));
