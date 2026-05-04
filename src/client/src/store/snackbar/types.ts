import {ReactNode} from "react";

export type SnackbarType = 'success' | 'error' | 'warning' | 'info';
export type SnackbarPlacementType = "top-start" | "top-end" | "bottom-start" | "bottom-end";

export type SnackbarItem = {
    id: number;
    text: ReactNode;
    type: SnackbarType;
    action?: ReactNode;
    onActionClick?(): void;
};

export type SnackbarStore = {
    snackbars: SnackbarItem[];
    placement: SnackbarPlacementType;
    changePlacement: (placement: SnackbarPlacementType) => void;
    addSnackbar(snackbar: Omit<SnackbarItem, 'id'>): number;
    removeSnackbar(id: number): void;
};
