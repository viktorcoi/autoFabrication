import type {Row as TableModelRow} from '@tanstack/react-table';
import type {MutableRefObject, MouseEvent, RefObject} from 'react';
import type {
    BooleanChangeEventParams,
    CellMouseEventParams,
    Column,
    SelectionState,
    TableProps,
    TableRow,
} from '../types';

export type TableBodyProps = {
    disabled?: boolean;
    loading: boolean;
    scrollRef: RefObject<HTMLDivElement | null>;
    visibleRows: TableModelRow<TableRow>[];
    columnMap: Map<string, Column>;
    draggingColumnId: string | null;
    resizingColumnId: string | null;
    selectedRowIdsSet: Set<string>;
    rowRefsRef: RefObject<Record<string, HTMLTableRowElement | null>>;
    previewSelectedRowIdsRef: RefObject<string[]>;
    selectionStateRef: RefObject<SelectionState>;
    onEventRef: RefObject<TableProps['onEvent']>;
    beginSelection: (rowId: string, event: MouseEvent<HTMLTableRowElement>) => void;
    extendSelection: (rowId: string, target: EventTarget | null) => void;
    getNextRowSelection: (
        rowId: string,
        event: {
            shiftKey?: boolean;
            ctrlKey?: boolean;
            metaKey?: boolean;
        } | null,
    ) => string[];
    setSelectedRows: (nextRowIds: string[]) => boolean;
    emitSelectedRows: (target: EventTarget | null) => void;
    emitCellClick: (params: CellMouseEventParams) => void;
    emitCellDoubleClick: (params: CellMouseEventParams) => void;
    emitInteractiveClick: (
        type: 'button' | 'download',
        params: CellMouseEventParams,
    ) => void;
    emitBooleanChange: (params: BooleanChangeEventParams) => void;
};
