import type {ColumnSizingState, SortingState} from '@tanstack/react-table';
import type {Column, PaginationItem, TableRow, TableSettings, TableSorting} from './types';

export const PAGE_SIZE_OPTIONS = [20, 50, 100];
export const EMPTY_STATE = {
    title: 'Нет данных',
    description: '',
};
export const DRAG_START_THRESHOLD = 4;
export const DEFAULT_COLUMN_SIZE = 180;
export const DEFAULT_COLUMN_MIN_SIZE = 120;
export const DEFAULT_COLUMN_MAX_SIZE = 520;
export const TABLE_TOTAL_WIDTH_CSS_VAR = '--table-total-width';

const safeJsonParse = <T, >(value: string | null, fallback: T): T => {
    if (!value) {
        return fallback;
    }

    try {
        return JSON.parse(value) as T;
    } catch {
        return fallback;
    }
};

const normalizeSettings = (value: unknown): TableSettings => {
    if (Array.isArray(value)) {
        return value
            .filter((item): item is {key: string; settings?: {width?: unknown; sort?: unknown}} =>
                Boolean(
                    item
                    && typeof item === 'object'
                    && 'key' in item
                    && typeof (item as {key: unknown}).key === 'string',
                ),
            )
            .map((item) => ({
                key: item.key,
                settings: {
                    width: typeof item.settings?.width === 'number' ? item.settings.width : undefined,
                    sort:
                        item.settings?.sort === 'asc' || item.settings?.sort === 'desc'
                            ? item.settings.sort
                            : null,
                },
            }));
    }

    if (value && typeof value === 'object' && 'columns' in value) {
        const columns = (value as {columns?: Record<string, {width?: unknown; sort?: unknown}>}).columns;

        if (columns && typeof columns === 'object') {
            return Object.entries(columns).map(([key, settings]) => ({
                key,
                settings: {
                    width: typeof settings?.width === 'number' ? settings.width : undefined,
                    sort: settings?.sort === 'asc' || settings?.sort === 'desc' ? settings.sort : null,
                },
            }));
        }
    }

    return [];
};

export const getStoredSettings = (settingsKey: string): TableSettings => {
    if (typeof window === 'undefined') {
        return [];
    }

    try {
        return normalizeSettings(safeJsonParse<unknown>(window.localStorage.getItem(settingsKey), []));
    } catch {
        return [];
    }
};

export const saveStoredSettings = (settingsKey: string, settings: TableSettings) => {
    if (typeof window === 'undefined') {
        return;
    }

    try {
        window.localStorage.setItem(settingsKey, JSON.stringify(settings));
    } catch {
        // Ignore storage errors.
    }
};

export const removeStoredSettings = (settingsKey: string) => {
    if (typeof window === 'undefined') {
        return;
    }

    try {
        window.localStorage.removeItem(settingsKey);
    } catch {
        // Ignore storage errors.
    }
};

export const getRange = (items: string[], from: string, to: string) => {
    const fromIndex = items.indexOf(from);
    const toIndex = items.indexOf(to);

    if (fromIndex < 0 || toIndex < 0) {
        return [];
    }

    const [start, end] = fromIndex <= toIndex ? [fromIndex, toIndex] : [toIndex, fromIndex];
    return items.slice(start, end + 1);
};

export const buildPagination = (currentPage: number, pageCount: number): PaginationItem[] => {
    if (pageCount <= 7) {
        return Array.from({length: pageCount}, (_, index) => index + 1);
    }

    if (currentPage <= 4) {
        return [1, 2, 3, 4, 5, 'ellipsis-right', pageCount];
    }

    if (currentPage >= pageCount - 3) {
        return [1, 'ellipsis-left', pageCount - 4, pageCount - 3, pageCount - 2, pageCount - 1, pageCount];
    }

    return [1, 'ellipsis-left', currentPage - 1, currentPage, currentPage + 1, 'ellipsis-right', pageCount];
};

export const areArraysEqual = (left: string[], right: string[]) => {
    if (left.length !== right.length) {
        return false;
    }

    for (let index = 0; index < left.length; index += 1) {
        if (left[index] !== right[index]) {
            return false;
        }
    }

    return true;
};

export const areSortingsEqual = (left: TableSorting, right: TableSorting) => {
    if (left === right) {
        return true;
    }

    if (!left || !right) {
        return false;
    }

    return left.id === right.id && left.sort === right.sort;
};

export const areColumnSizingEqual = (left: ColumnSizingState, right: ColumnSizingState) => {
    const leftKeys = Object.keys(left);
    const rightKeys = Object.keys(right);

    if (leftKeys.length !== rightKeys.length) {
        return false;
    }

    for (let index = 0; index < leftKeys.length; index += 1) {
        const key = leftKeys[index];

        if (left[key] !== right[key]) {
            return false;
        }
    }

    return true;
};

export const moveColumnOrder = (order: string[], activeId: string, overId: string, placeAfter: boolean) => {
    if (!activeId || !overId || activeId === overId) {
        return order;
    }

    const nextOrder = order.filter((columnId) => columnId !== activeId);
    const targetIndex = nextOrder.indexOf(overId);

    if (targetIndex < 0) {
        return order;
    }

    nextOrder.splice(placeAfter ? targetIndex + 1 : targetIndex, 0, activeId);
    return areArraysEqual(nextOrder, order) ? order : nextOrder;
};

export const restoreColumnOrderFromDefaults = (order: string[], defaultOrder: string[], columnId: string) => {
    const orderWithoutColumn = order.filter((value) => value !== columnId);
    const defaultIndex = defaultOrder.indexOf(columnId);

    if (defaultIndex < 0) {
        return order;
    }

    for (let index = defaultIndex - 1; index >= 0; index -= 1) {
        const previousColumnId = defaultOrder[index];
        const previousOrderIndex = orderWithoutColumn.indexOf(previousColumnId);

        if (previousOrderIndex >= 0) {
            const nextOrder = [...orderWithoutColumn];
            nextOrder.splice(previousOrderIndex + 1, 0, columnId);
            return areArraysEqual(nextOrder, order) ? order : nextOrder;
        }
    }

    for (let index = defaultIndex + 1; index < defaultOrder.length; index += 1) {
        const nextColumnId = defaultOrder[index];
        const nextOrderIndex = orderWithoutColumn.indexOf(nextColumnId);

        if (nextOrderIndex >= 0) {
            const nextOrder = [...orderWithoutColumn];
            nextOrder.splice(nextOrderIndex, 0, columnId);
            return areArraysEqual(nextOrder, order) ? order : nextOrder;
        }
    }

    return [...orderWithoutColumn, columnId];
};

export const tableSortingToSortingState = (sorting: TableSorting): SortingState => {
    if (!sorting) {
        return [];
    }

    return [{
        id: sorting.id,
        desc: sorting.sort === 'desc',
    }];
};

export const sortingStateToTableSorting = (sortingState: SortingState): TableSorting => {
    const item = sortingState[0];

    if (!item) {
        return null;
    }

    return {
        id: item.id,
        sort: item.desc ? 'desc' : 'asc',
    };
};

export const getDefaultRowId = (row: TableRow, index: number) => {
    const value = row.id;
    return typeof value === 'string' || typeof value === 'number' ? String(value) : String(index);
};

export const isInteractiveTarget = (target: EventTarget | null) => {
    if (!(target instanceof HTMLElement)) {
        return false;
    }

    return Boolean(
        target.closest(
            'button, a, input, textarea, select, label, summary, [role="button"], [role="link"], [data-table-ignore-row]',
        ),
    );
};

export const getColumnDefaultWidth = (column?: Column) => column?.size ?? DEFAULT_COLUMN_SIZE;

export const getColumnMinWidth = (column?: Column) => column?.minSize ?? DEFAULT_COLUMN_MIN_SIZE;

export const getColumnMaxWidth = (column?: Column) => column?.maxSize ?? DEFAULT_COLUMN_MAX_SIZE;

export const clampColumnWidth = (width: number, column?: Column) => {
    return Math.min(getColumnMaxWidth(column), Math.max(getColumnMinWidth(column), Math.round(width)));
};

export const getColumnWidthCssVarName = (columnId: string) => {
    return `--table-column-${columnId.replace(/[^a-zA-Z0-9_-]/g, '_')}-width`;
};

const getResolvedColumnWidth = (column: Column, sizing: ColumnSizingState) => {
    const explicitWidth = sizing[column.key];

    if (typeof explicitWidth === 'number') {
        return clampColumnWidth(explicitWidth, column);
    }

    return getColumnDefaultWidth(column);
};

export const applyColumnSizingPreview = (
    tableElement: HTMLTableElement | null,
    columns: Column[],
    sizing: ColumnSizingState,
) => {
    if (!tableElement) {
        return;
    }

    let totalWidth = 0;

    columns.forEach((column) => {
        const width = getResolvedColumnWidth(column, sizing);
        totalWidth += width;
        tableElement.style.setProperty(getColumnWidthCssVarName(column.key), `${width}px`);
    });

    tableElement.style.setProperty(TABLE_TOTAL_WIDTH_CSS_VAR, `${totalWidth}px`);
};

export const getStorageId = (tableId?: string, componentName?: string) => {
    if (tableId) {
        return tableId;
    }

    if (componentName) {
        return componentName;
    }

    if (typeof window === 'undefined') {
        return 'table';
    }

    return window.location.pathname.replace(/\//g, '_') || 'table';
};
