import type {SortingState} from '@tanstack/react-table';
import type {MouseEvent as ReactMouseEvent, ReactNode} from 'react';

export type TableRow = Record<string, unknown>;

export type Column = {
    key: string;
    header: ReactNode;
    size?: number;
    minSize?: number;
    maxSize?: number;
    render?: (value: unknown, row: TableRow) => ReactNode;
};

type TableEventMeta = {
    target: EventTarget | null;
};

export type TableEvent =
    | ({type: 'rowClick'; row: TableRow} & TableEventMeta)
    | ({
    type: 'cellClick';
    row: TableRow;
    column: string;
    value: unknown;
    event: ReactMouseEvent<HTMLTableCellElement>;
} & TableEventMeta)
    | ({type: 'contextMenu'; row: TableRow; column: string; value: unknown} & TableEventMeta)
    | ({type: 'pageChange'; page: number} & TableEventMeta)
    | ({type: 'rowsChange'; rows: number} & TableEventMeta)
    | ({type: 'sortChange'; sorting: SortingState} & TableEventMeta)
    | ({type: 'selected'; rowIds: string[]; rows: TableRow[]} & TableEventMeta);

export type TableEmptyState = {
    title?: string;
    description?: string;
};

export type TableProps = {
    disabled?: boolean;
    tableId?: string;
    componentName?: string;
    data: TableRow[];
    columns: Column[];
    total: number;
    page: number;
    rows: number;
    loading?: boolean;
    onEvent: (event: TableEvent) => void;
    getRowId?: (row: TableRow, index: number) => string;
    emptyState?: TableEmptyState;
};

export type TableSettings = Array<{
    key: string;
    settings: {
        width?: number;
        sort?: 'asc' | 'desc' | null;
    };
}>;

export type DragGhostState = {
    columnId: string;
    width: number;
    height: number;
    top: number;
    left: number;
} | null;

export type ColumnDragInteraction = {
    columnId: string;
    startX: number;
    startY: number;
    currentX: number;
    started: boolean;
    offsetX: number;
    top: number;
    width: number;
    height: number;
    target: EventTarget | null;
    ghostFrameId: number | null;
} | null;

export type ColumnResizeInteraction = {
    columnId: string;
    startX: number;
    startWidth: number;
    currentWidth: number;
    minWidth: number;
    maxWidth: number;
    frameId: number | null;
} | null;

export type PaginationItem = number | 'ellipsis-left' | 'ellipsis-right';
