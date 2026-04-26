import type {Dispatch, SetStateAction} from 'react';
import type {PaginationItem} from '../types';

export type TableFooterProps = {
    disabled?: boolean;
    loading: boolean;
    editing: boolean;
    saveDisabled: boolean;
    safeRows: number;
    pageIndex: number;
    pageCount: number;
    currentPage: number;
    jumpMode: null | 'left' | 'right';
    jumpValue: string;
    paginationItems: PaginationItem[];
    setJumpMode: Dispatch<SetStateAction<null | 'left' | 'right'>>;
    setJumpValue: Dispatch<SetStateAction<string>>;
    submitJump: () => void;
    onStartEdit: (target: EventTarget | null) => void;
    onCancelEdit: (target: EventTarget | null) => void;
    onSaveEdit: (target: EventTarget | null) => void;
    onRowsChange: (rows: number, target: EventTarget | null) => void;
    onPageChange: (page: number, target: EventTarget | null) => void;
    total: number;
};
