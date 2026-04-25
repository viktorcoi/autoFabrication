import type {
    ChangeEvent as ReactChangeEvent,
    MouseEvent as ReactMouseEvent,
    ReactNode,
} from 'react';

export type TableRow = Record<string, unknown> & {
    id: number;
    isConst?: string[];
    isRequired?: string[];
};

export type ColumnType = 'text' | 'button' | 'download' | 'boolean' | 'avatar' | 'date';

export type Column = {
    key: string;
    header: ReactNode;
    type?: ColumnType | string;
    size?: number;
    minSize?: number;
    maxSize?: number;
    isConst?: boolean;
    isRequired?: boolean;
    render?: (value: unknown, row: TableRow) => ReactNode;
};

export type TableDraftChanges = Record<number, Record<string, string>>;

type TableEventMeta = {
    target: EventTarget | null;
};

export type TableSorting = {
    id: string;
    sort: 'asc' | 'desc';
} | null;

export type SelectionState = {
    active: boolean;
    dirty: boolean;
    target: EventTarget | null;
};

export type CellMouseEventParams = {
    row: TableRow;
    column: string;
    value: unknown;
    event: ReactMouseEvent<HTMLElement>;
    target: EventTarget | null;
};

export type BooleanChangeEventParams = {
    row: TableRow;
    column: string;
    value: unknown;
    nextValue: unknown;
    event: ReactChangeEvent<HTMLInputElement>;
    target: EventTarget | null;
};

export type TableEvent =
    | ({type: 'rowClick'; row: TableRow} & TableEventMeta)
    | ({type: 'rowDoubleClick'; row: TableRow} & TableEventMeta)
    | ({
    type: 'cellClick';
    row: TableRow;
    column: string;
    value: unknown;
    event: ReactMouseEvent<HTMLElement>;
} & TableEventMeta)
    | ({
    type: 'cellDoubleClick';
    row: TableRow;
    column: string;
    value: unknown;
    event: ReactMouseEvent<HTMLElement>;
} & TableEventMeta)
    | ({
    type: 'button';
    row: TableRow;
    column: string;
    value: unknown;
    event: ReactMouseEvent<HTMLElement>;
} & TableEventMeta)
    | ({
    type: 'download';
    row: TableRow;
    column: string;
    value: unknown;
    event: ReactMouseEvent<HTMLElement>;
} & TableEventMeta)
    | ({
    type: 'boolean';
    row: TableRow;
    column: string;
    value: unknown;
    nextValue: unknown;
    event: ReactChangeEvent<HTMLInputElement>;
} & TableEventMeta)
    | ({type: 'contextMenu'; row: TableRow; column: string; value: unknown} & TableEventMeta)
    | ({type: 'pageChange'; page: number} & TableEventMeta)
    | ({type: 'rowsChange'; rows: number} & TableEventMeta)
    | ({type: 'sortChange'; sorting: TableSorting} & TableEventMeta)
    | ({type: 'selected'; rowIds: number[]; rows: TableRow[]} & TableEventMeta)
    | ({type: 'editSave'; changes: TableDraftChanges} & TableEventMeta);

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
    selected?: number[];
    onEvent: (event: TableEvent) => void;
    getRowId?: (row: TableRow, index: number) => number;
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
    baseSizing: Record<string, number>;
    minWidth: number;
    maxWidth: number;
    frameId: number | null;
} | null;

export type PaginationItem = number | 'ellipsis-left' | 'ellipsis-right';
