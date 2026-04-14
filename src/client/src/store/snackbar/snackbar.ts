import { create } from 'zustand';
import {SnackbarStore} from "@/store/snackbar/types";

export const useSnackbarStore = create<SnackbarStore>((set) => ({
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
