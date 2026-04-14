import {ReactNode} from "react";

export type SnackbarType = 'success' | 'error' | 'warning' | 'info';

export type SnackbarItem = {
    id: number;
    text: ReactNode;
    type: SnackbarType;
    action?: ReactNode;
    onActionClick?(): void;
};

export type SnackbarStore = {
    snackbars: SnackbarItem[];
    addSnackbar(snackbar: Omit<SnackbarItem, 'id'>): number;
    removeSnackbar(id: number): void;
};
