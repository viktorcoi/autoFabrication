import type {HeaderGroup} from '@tanstack/react-table';
import type {MouseEvent, RefObject} from 'react';
import type {Column, TableRow} from '../types';

export type TableHeaderProps = {
    disabled?: boolean;
    loading: boolean;
    headerGroups: HeaderGroup<TableRow>[];
    columnMap: Map<string, Column>;
    draggingColumnId: string | null;
    resizingColumnId: string | null;
    headerCellRefsRef: RefObject<Record<string, HTMLTableCellElement | null>>;
    onOpenContextMenu: (columnId: string, point: {x: number; y: number}) => void;
    beginColumnInteraction: (columnId: string, event: MouseEvent<HTMLDivElement>) => void;
    beginColumnResize: (columnId: string, event: MouseEvent<HTMLDivElement>) => void;
};
