import type {Row as TableModelRow} from '@tanstack/react-table';
import type {MouseEvent, RefObject} from 'react';
import type {
    BooleanChangeEventParams,
    CellMouseEventParams,
    Column,
    SelectionState,
    TableDraftChanges,
    TableProps,
    TableRow,
} from '../types';

export type TableBodyProps = {
    disabled?: boolean;
    loading: boolean;
    editing: boolean;
    scrollRef: RefObject<HTMLDivElement | null>;
    visibleRows: TableModelRow<TableRow>[];
    columnMap: Map<string, Column>;
    draftChanges: TableDraftChanges;
    invalidRequiredCellKeys: Set<string>;
    draggingColumnId: string | null;
    resizingColumnId: string | null;
    selectedRowIdsSet: Set<number>;
    rowRefsRef: RefObject<Record<number, HTMLTableRowElement | null>>;
    measuredRowHeightsRef: RefObject<Record<number, number>>;
    rowHeights: Record<number, number>;
    previewSelectedRowIdsRef: RefObject<number[]>;
    selectionStateRef: RefObject<SelectionState>;
    onEventRef: RefObject<TableProps['onEvent']>;
    beginSelection: (rowId: number, event: MouseEvent<HTMLTableRowElement>) => void;
    extendSelection: (rowId: number, target: EventTarget | null) => void;
    getNextRowSelection: (
        rowId: number,
        event: {
            shiftKey?: boolean;
            ctrlKey?: boolean;
            metaKey?: boolean;
        } | null,
    ) => number[];
    setSelectedRows: (nextRowIds: number[]) => boolean;
    emitSelectedRows: (target: EventTarget | null) => void;
    emitCellClick: (params: CellMouseEventParams) => void;
    emitCellDoubleClick: (params: CellMouseEventParams) => void;
    emitInteractiveClick: (
        type: 'button' | 'download' | 'access',
        params: CellMouseEventParams,
    ) => void;
    emitBooleanChange: (params: BooleanChangeEventParams) => void;
    onDraftTextChange: (rowId: number, columnId: string, value: string) => void;
};
