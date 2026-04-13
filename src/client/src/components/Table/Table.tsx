import React, {useEffect, useMemo, useRef, useState} from 'react';
import {createPortal} from 'react-dom';
import {
    type ColumnDef,
    type ColumnOrderState,
    type ColumnSizingState,
    type SortingState,
    flexRender,
    getCoreRowModel,
    getSortedRowModel,
    useReactTable,
} from '@tanstack/react-table';
import {
    ActionSheet,
    ActionSheetItem,
    Button,
    Card,
    Input,
    Select,
    Spinner,
    Text,
} from '@vkontakte/vkui';
import {
    Icon16ArrowRightOutline,
    Icon16ArrowsUpDown,
    Icon16Cancel,
    Icon16CheckOutline,
    Icon16ChevronLeft,
    Icon16SortArrowDown,
    Icon16SortArrowUp,
    Icon16SortOutline,
} from '@vkontakte/icons';
import styles from './Table.module.scss';

type Column = {
    key: string;
    header: string;
    size?: number;
    minSize?: number;
    maxSize?: number;
    render?: (value: unknown, row: any) => React.ReactNode;
};

type TableClickMeta = {
    target: EventTarget | null;
};

type TableEvent =
    | ({ type: 'rowClick'; row: any } & TableClickMeta)
    | ({
    type: 'cellClick';
    row: any;
    column: string;
    value: unknown;
    event: React.MouseEvent<HTMLTableCellElement>
} & TableClickMeta)
    | ({ type: 'contextMenu'; row: any; column: string; value: unknown } & TableClickMeta)
    | ({ type: 'pageChange'; page: number } & TableClickMeta)
    | ({ type: 'pageSizeChange'; pageSize: number } & TableClickMeta)
    | ({ type: 'sortChange'; sorting: SortingState } & TableClickMeta)
    | ({ type: 'selected'; rowIds: string[]; rows: any[] } & TableClickMeta);

type Props = {
    tableId?: string;
    componentName?: string;
    data: any[];
    columns: Column[];
    total: number;
    page: number;
    pageSize: number;
    loading?: boolean;
    onEvent: (e: TableEvent) => void;
    emptyState?: {
        title?: string;
        description?: string;
    };
};

type TableSettings = {
    key: string;
    settings: {
        width?: number;
        sort?: 'asc' | 'desc' | null;
    };
}[];

type DragGhost = {
    x: number;
    y: number;
    width: number;
    height: number;
    pointerOffsetX: number;
    html: string;
} | null;

const normalizeSettings = (value: unknown): TableSettings => {
    if (Array.isArray(value)) {
        return value
            .filter((item): item is { key: string; settings?: { width?: unknown; sort?: unknown } } =>
                Boolean(item && typeof item === 'object' && 'key' in item && typeof (item as {
                    key: unknown
                }).key === 'string'),
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

    // Legacy object format support:
    // { columns: { city: { width: 120, sort: 'asc' } } }
    if (value && typeof value === 'object' && 'columns' in value) {
        const columns = (value as { columns?: Record<string, { width?: unknown; sort?: unknown }> }).columns;
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

const PAGE_SIZE_OPTIONS = [25, 50, 100];

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

const getStoredSettings = (settingsKey: string): TableSettings => {
    if (typeof window === 'undefined') {
        return [];
    }

    return normalizeSettings(safeJsonParse<unknown>(window.localStorage.getItem(settingsKey), []));
};

const classNames = (...parts: Array<string | false | null | undefined>) =>
    parts.filter(Boolean).join(' ');

const getRange = (items: string[], from: string, to: string) => {
    const fromIndex = items.indexOf(from);
    const toIndex = items.indexOf(to);
    if (fromIndex < 0 || toIndex < 0) {
        return [];
    }
    const [start, end] = fromIndex <= toIndex ? [fromIndex, toIndex] : [toIndex, fromIndex];
    return items.slice(start, end + 1);
};

const buildPagination = (currentPage: number, pageCount: number): Array<number | 'ellipsis-left' | 'ellipsis-right'> => {
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

const Table = ({
    tableId,
    componentName,
    data,
    columns,
    total,
    page,
    pageSize,
    loading,
    onEvent,
    emptyState,
}: Props) => {
    const tableStorageId =
        tableId ||
        componentName ||
        (typeof window !== 'undefined' ? window.location.pathname.replace(/\//g, '_') : 'table');
    const settingsKey = `table_settings_${tableStorageId}`;

    const [sorting, setSorting] = useState<SortingState>([]);
    const [columnOrder, setColumnOrder] = useState<ColumnOrderState>(() => columns.map((column) => column.key));
    const [columnSizing, setColumnSizing] = useState<ColumnSizingState>({});

    const [selectedRowIds, setSelectedRowIds] = useState<string[]>([]);
    const [selectionAnchorRowId, setSelectionAnchorRowId] = useState<string | null>(null);
    const [rowDragSelecting, setRowDragSelecting] = useState(false);
    const [draggingColumnId, setDraggingColumnId] = useState<string | null>(null);
    const [dragGhost, setDragGhost] = useState<DragGhost>(null);
    const [resizingColumnId, setResizingColumnId] = useState<string | null>(null);
    const [headerContextColumnId, setHeaderContextColumnId] = useState<string | null>(null);
    const [headerContextPoint, setHeaderContextPoint] = useState({x: 0, y: 0});
    const [jumpMode, setJumpMode] = useState<null | 'left' | 'right'>(null);
    const [jumpValue, setJumpValue] = useState(String(page + 1));

    const availableColumnIds = useMemo(() => columns.map((column) => column.key), [columns]);
    const pendingSortTargetRef = useRef<EventTarget | null>(null);
    const sortDirtyRef = useRef(false);
    const selectedRowIdsRef = useRef<string[]>([]);
    const selectionDirtyRef = useRef(false);
    const selectionTargetRef = useRef<EventTarget | null>(null);
    const headerContextToggleRef = useRef<HTMLDivElement>(null);
    const dragColumnIdRef = useRef<string | null>(null);
    const emptyDragImageRef = useRef<HTMLImageElement | null>(null);
    const resizeActiveRef = useRef(false);
    const viewportRef = useRef<HTMLDivElement>(null);

    const tableColumns = useMemo<ColumnDef<any>[]>(
        () =>
            columns.map((column) => ({
                accessorKey: column.key,
                header: column.header,
                size: column.size ?? 180,
                minSize: column.minSize ?? 120,
                maxSize: column.maxSize ?? 520,
                cell: (info) => {
                    if (column.render) {
                        return column.render(info.getValue(), info.row.original);
                    }
                    return info.getValue() as React.ReactNode;
                },
            })),
        [columns],
    );

    const table = useReactTable({
        data,
        columns: tableColumns,
        state: {sorting, columnOrder, columnSizing},
        onSortingChange: (updater) => {
            sortDirtyRef.current = true;
            setSorting(updater);
        },
        onColumnOrderChange: setColumnOrder,
        onColumnSizingChange: setColumnSizing,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        columnResizeMode: 'onChange',
        defaultColumn: {
            size: 180,
            minSize: 120,
            maxSize: 520,
        },
    });

    const pageCount = Math.max(1, Math.ceil(total / pageSize));
    const currentPage = page + 1;
    const visibleRows = table.getRowModel().rows;
    const visibleRowIds = visibleRows.map((row) => row.id);
    const paginationItems = buildPagination(currentPage, pageCount);

    useEffect(() => {
        const initialSettings = getStoredSettings(settingsKey);
        const nextSorting = initialSettings
            .filter((item) => item.settings.sort === 'asc' || item.settings.sort === 'desc')
            .map((item) => ({id: item.key, desc: item.settings.sort === 'desc'}));
        const savedOrder = initialSettings.map((item) => item.key);
        const filtered = savedOrder.filter((key) => columns.some((column) => column.key === key));
        const missing = columns.map((column) => column.key).filter((key) => !filtered.includes(key));
        const nextSizing: ColumnSizingState = {};

        for (const item of initialSettings) {
            if (typeof item.settings.width === 'number') {
                nextSizing[item.key] = item.settings.width;
            }
        }

        setSorting(nextSorting);
        setColumnOrder([...filtered, ...missing]);
        setColumnSizing(nextSizing);
    }, [columns, settingsKey]);

    useEffect(() => {
        setColumnOrder((prev) => {
            const filtered = prev.filter((key) => availableColumnIds.includes(key));
            const missing = availableColumnIds.filter((key) => !filtered.includes(key));
            const next = [...filtered, ...missing];
            return next.length === prev.length && next.every((key, index) => key === prev[index]) ? prev : next;
        });
    }, [availableColumnIds]);

    useEffect(() => {
        const sortMap = new Map<string, 'asc' | 'desc'>();
        sorting.forEach((item) => sortMap.set(item.id, item.desc ? 'desc' : 'asc'));

        const ordered = [
            ...columnOrder.filter((key) => availableColumnIds.includes(key)),
            ...availableColumnIds.filter((key) => !columnOrder.includes(key)),
        ];

        const payload: TableSettings = ordered.map((key) => ({
            key,
            settings: {
                width: typeof columnSizing[key] === 'number' ? columnSizing[key] : undefined,
                sort: sortMap.get(key) ?? null,
            },
        }));
        if (typeof window !== 'undefined') {
            window.localStorage.setItem(settingsKey, JSON.stringify(payload));
        }
    }, [availableColumnIds, columnOrder, columnSizing, settingsKey, sorting]);

    useEffect(() => {
        selectedRowIdsRef.current = selectedRowIds;
    }, [selectedRowIds]);

    useEffect(() => {
        if (!sortDirtyRef.current) {
            return;
        }
        sortDirtyRef.current = false;
        onEvent({type: 'sortChange', sorting, target: pendingSortTargetRef.current});
        pendingSortTargetRef.current = null;
    }, [onEvent, sorting]);

    useEffect(() => {
        setJumpValue(String(page + 1));
    }, [page]);

    useEffect(() => {
        const onMouseUp = () => {
            setResizingColumnId(null);
            setRowDragSelecting(false);
            resizeActiveRef.current = false;
            if (selectionDirtyRef.current) {
                selectionDirtyRef.current = false;
                const selectedRows = visibleRows
                    .filter((row) => selectedRowIdsRef.current.includes(row.id))
                    .map((row) => row.original);
                onEvent({
                    type: 'selected',
                    rowIds: selectedRowIdsRef.current,
                    rows: selectedRows,
                    target: selectionTargetRef.current,
                });
            }
        };
        window.addEventListener('mouseup', onMouseUp);
        return () => window.removeEventListener('mouseup', onMouseUp);
    }, [onEvent, visibleRows]);

    useEffect(() => {
        const img = new Image();
        img.src =
            'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==';
        emptyDragImageRef.current = img;
    }, []);

    useEffect(() => {
        if (!draggingColumnId) {
            return;
        }

        const onWindowDragOver = (event: DragEvent) => {
            updateDragGhostX(event.clientX);
        };

        window.addEventListener('dragover', onWindowDragOver);
        return () => window.removeEventListener('dragover', onWindowDragOver);
    }, [draggingColumnId]);

    const getNextRowSelection = (rowId: string, event: {
        shiftKey?: boolean;
        ctrlKey?: boolean;
        metaKey?: boolean
    } | null) => {
        let next: string[] = selectedRowIdsRef.current;

        if (event?.shiftKey && selectionAnchorRowId) {
            next = getRange(visibleRowIds, selectionAnchorRowId, rowId);
        } else if (event && (event.ctrlKey || event.metaKey)) {
            next = selectedRowIdsRef.current.includes(rowId)
                ? selectedRowIdsRef.current.filter((value) => value !== rowId)
                : [...selectedRowIdsRef.current, rowId];
            setSelectionAnchorRowId(rowId);
        } else {
            next = [rowId];
            setSelectionAnchorRowId(rowId);
        }
        return next;
    };

    const applyRowSelection = (rowId: string, event: React.MouseEvent | null, target: EventTarget | null) => {
        const next = getNextRowSelection(rowId, event);
        selectionTargetRef.current = target;
        selectionDirtyRef.current = true;
        setSelectedRowIds(next);
    };

    const applyRowRangeSelection = (toRowId: string, target: EventTarget | null) => {
        if (!selectionAnchorRowId) {
            return;
        }
        const next = getRange(visibleRowIds, selectionAnchorRowId, toRowId);
        selectionTargetRef.current = target;
        selectionDirtyRef.current = true;
        setSelectedRowIds(next);
    };

    const moveColumn = (fromColumnId: string, toColumnId: string) => {
        if (!fromColumnId || fromColumnId === toColumnId) {
            return;
        }

        const beforePositions = new Map<string, number>();
        viewportRef.current
            ?.querySelectorAll<HTMLElement>('[data-cell-key]')
            .forEach((el) => {
                const key = el.dataset.cellKey;
                if (key) {
                    beforePositions.set(key, el.getBoundingClientRect().left);
                }
            });
        setColumnOrder((prevOrder) => {
            const nextOrder = [...prevOrder];
            const fromIndex = nextOrder.indexOf(fromColumnId);
            const toIndex = nextOrder.indexOf(toColumnId);
            if (fromIndex < 0 || toIndex < 0) {
                return prevOrder;
            }
            nextOrder.splice(fromIndex, 1);
            nextOrder.splice(toIndex, 0, fromColumnId);
            return nextOrder;
        });

        requestAnimationFrame(() => {
            viewportRef.current
                ?.querySelectorAll<HTMLElement>('[data-cell-key]')
                .forEach((el) => {
                    const key = el.dataset.cellKey;
                    if (!key) {
                        return;
                    }
                    const previousLeft = beforePositions.get(key);
                    if (previousLeft === undefined) {
                        return;
                    }
                    const deltaX = previousLeft - el.getBoundingClientRect().left;
                    if (Math.abs(deltaX) < 1) {
                        return;
                    }
                    el.animate(
                        [
                            {transform: `translateX(${deltaX}px)`},
                            {transform: 'translateX(0px)'},
                        ],
                        {
                            duration: 170,
                            easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
                        },
                    );
                });
        });
    };

    const shouldMoveToTarget = (
        event: React.DragEvent<HTMLTableCellElement>,
        fromColumnId: string,
        targetColumnId: string,
    ) => {
        const sourceIndex = columnOrder.indexOf(fromColumnId);
        const targetIndex = columnOrder.indexOf(targetColumnId);
        if (sourceIndex < 0 || targetIndex < 0 || sourceIndex === targetIndex) {
            return false;
        }

        const rect = event.currentTarget.getBoundingClientRect();
        const leftThreshold = rect.left + rect.width * 0.35;
        const rightThreshold = rect.left + rect.width * 0.65;
        const movingRight = sourceIndex < targetIndex;
        return movingRight ? event.clientX > rightThreshold : event.clientX < leftThreshold;
    };

    const updateDragGhostX = (clientX: number) => {
        setDragGhost((prev) => {
            if (!prev) {
                return prev;
            }
            return {
                ...prev,
                x: clientX - prev.pointerOffsetX,
            };
        });
    };

    const resetCurrentColumnSorting = (columnId: string) => {
        sortDirtyRef.current = true;
        setSorting((prev) => prev.filter((item) => item.id !== columnId));
    };

    const resetCurrentColumnSettings = (columnId: string) => {
        sortDirtyRef.current = true;
        setSorting((prev) => prev.filter((item) => item.id !== columnId));
        setColumnSizing((prev) => {
            const next = {...prev};
            delete next[columnId];
            return next;
        });
    };

    const resetTableSettings = () => {
        sortDirtyRef.current = true;
        setSorting([]);
        setColumnSizing({});
        setColumnOrder(columns.map((column) => column.key));
        setSelectedRowIds([]);
        setSelectionAnchorRowId(null);
        if (typeof window !== 'undefined') {
            window.localStorage.removeItem(settingsKey);
        }
    };

    const submitJump = () => {
        const numericValue = Number(jumpValue);
        if (!Number.isFinite(numericValue)) {
            return;
        }
        const nextPage = Math.min(pageCount, Math.max(1, Math.round(numericValue)));
        setJumpMode(null);
        onEvent({type: 'pageChange', page: nextPage - 1, target: null});
    };

    return (
        <Card Component="div" className={styles.card}>
            <div className={styles.toolbar}>
                <Button
                    size="m"
                    mode="secondary"
                    onClick={(event) => {
                        pendingSortTargetRef.current = event.target;
                        sortDirtyRef.current = true;
                        setSorting([]);
                    }}
                >
                    Сбросить сортировку
                </Button>
            </div>

            <div className={styles.viewport}>
                <div
                    ref={viewportRef}
                    className={classNames(
                        styles.scroll,
                        loading && styles.scrollLoading,
                        draggingColumnId && styles.scrollDragging,
                    )}
                >
                    <table className={styles.table} style={{width: table.getTotalSize()}}>
                        <thead>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <tr key={headerGroup.id}>
                                {headerGroup.headers.map((header) => {
                                    const columnId = header.column.id;
                                    const isDragging = draggingColumnId === columnId;
                                    const isResizing = resizingColumnId === columnId;

                                    return (
                                        <th
                                            key={header.id}
                                            data-cell-key={`h:${header.id}`}
                                            className={classNames(
                                                styles.headerCell,
                                                isDragging && styles.headerCellDragging,
                                                isResizing && styles.headerCellResizing,
                                            )}
                                            style={{width: header.getSize()}}
                                            draggable={!loading}
                                            onDragStart={(event) => {
                                                if (resizeActiveRef.current) {
                                                    event.preventDefault();
                                                    return;
                                                }
                                                dragColumnIdRef.current = columnId;
                                                setDraggingColumnId(columnId);
                                                event.dataTransfer.effectAllowed = 'move';
                                                event.dataTransfer.setData('text/plain', columnId);
                                                if (emptyDragImageRef.current) {
                                                    event.dataTransfer.setDragImage(emptyDragImageRef.current, 0, 0);
                                                }

                                                const rect = event.currentTarget.getBoundingClientRect();
                                                setDragGhost({
                                                    x: rect.left,
                                                    y: rect.top - 1,
                                                    width: rect.width,
                                                    height: rect.height,
                                                    pointerOffsetX: event.clientX - rect.left,
                                                    html: event.currentTarget.innerHTML,
                                                });
                                            }}
                                            onDragOver={(event) => {
                                                if (!dragColumnIdRef.current) {
                                                    return;
                                                }
                                                event.preventDefault();
                                                updateDragGhostX(event.clientX);
                                                const fromId = dragColumnIdRef.current;
                                                if (fromId === columnId) {
                                                    return;
                                                }

                                                if (shouldMoveToTarget(event, fromId, columnId)) {
                                                    moveColumn(fromId, columnId);
                                                }
                                            }}
                                            onDrop={(event) => {
                                                event.preventDefault();
                                            }}
                                            onDragEnd={() => {
                                                dragColumnIdRef.current = null;
                                                setDraggingColumnId(null);
                                                setDragGhost(null);
                                            }}
                                            onContextMenu={(event) => {
                                                event.preventDefault();
                                                setHeaderContextColumnId(columnId);
                                                setHeaderContextPoint({x: event.clientX, y: event.clientY});
                                            }}
                                        >
                                            <div className={styles.headerInner}>
                                                <div className={styles.dragHandle}>
                                                    <Icon16ArrowsUpDown/>
                                                </div>

                                                <button
                                                    type="button"
                                                    className={styles.sortButton}
                                                    onClick={(event) => {
                                                        pendingSortTargetRef.current = event.target;
                                                        sortDirtyRef.current = true;
                                                        header.column.toggleSorting(undefined, false);
                                                    }}
                                                >
                                                    <Text Component="span" className={styles.headerTitle}>
                                                        {flexRender(header.column.columnDef.header, header.getContext())}
                                                    </Text>
                                                    <span className={styles.sortIcon}>
                              {header.column.getIsSorted() === 'asc' && <Icon16SortArrowUp/>}
                                                        {header.column.getIsSorted() === 'desc' &&
                                                            <Icon16SortArrowDown/>}
                                                        {!header.column.getIsSorted() && <Icon16SortOutline/>}
                            </span>
                                                </button>
                                            </div>

                                            {header.column.getCanResize() && (
                                                <div
                                                    className={styles.resizeHandle}
                                                    onMouseDown={(event) => {
                                                        event.stopPropagation();
                                                        resizeActiveRef.current = true;
                                                        setResizingColumnId(columnId);
                                                        header.getResizeHandler()(event);
                                                    }}
                                                    onTouchStart={(event) => {
                                                        resizeActiveRef.current = true;
                                                        setResizingColumnId(columnId);
                                                        header.getResizeHandler()(event);
                                                    }}
                                                />
                                            )}
                                        </th>
                                    );
                                })}
                            </tr>
                        ))}
                        </thead>

                        <tbody>
                        {data.length === 0 ? (
                            <tr>
                                <td className={styles.emptyCell} colSpan={columns.length}>
                                    <Text Component="div" className={styles.emptyTitle}>
                                        {emptyState?.title || 'Нет данных'}
                                    </Text>
                                    {emptyState?.description && (
                                        <Text Component="div" className={styles.emptyDescription}>
                                            {emptyState.description}
                                        </Text>
                                    )}
                                </td>
                            </tr>
                        ) : (
                            visibleRows.map((row) => {
                                const isSelectedRow = selectedRowIds.includes(row.id);
                                return (
                                    <tr
                                        key={row.id}
                                        className={classNames(styles.bodyRow, isSelectedRow && styles.bodyRowSelected)}
                                        onMouseDown={(event) => {
                                            if (event.button !== 0) {
                                                return;
                                            }
                                            setRowDragSelecting(true);
                                            applyRowSelection(row.id, event, event.target);
                                        }}
                                        onMouseEnter={(event) => {
                                            if (rowDragSelecting) {
                                                applyRowRangeSelection(row.id, event.target);
                                            }
                                        }}
                                        onClick={(event) => onEvent({
                                            type: 'rowClick',
                                            row: row.original,
                                            target: event.target
                                        })}
                                    >
                                        {row.getVisibleCells().map((cell) => {
                                            const columnId = cell.column.id;
                                            const renderedCell = flexRender(cell.column.columnDef.cell, cell.getContext());
                                            const isPrimitive = typeof renderedCell === 'string' || typeof renderedCell === 'number';
                                            const isResizing = resizingColumnId === columnId;

                                            return (
                                                <td
                                                    key={cell.id}
                                                    data-cell-key={`c:${cell.id}`}
                                                    className={classNames(styles.bodyCell, isResizing && styles.bodyCellResizing)}
                                                    style={{width: cell.column.getSize()}}
                                                    onClick={(event) => {
                                                        event.stopPropagation();
                                                        onEvent({
                                                            type: 'cellClick',
                                                            row: row.original,
                                                            column: columnId,
                                                            value: cell.getValue(),
                                                            event,
                                                            target: event.target,
                                                        });
                                                    }}
                                                    onContextMenu={(event) => {
                                                        event.preventDefault();
                                                        const next = getNextRowSelection(row.id, event);
                                                        setSelectedRowIds(next);
                                                        selectedRowIdsRef.current = next;
                                                        selectionDirtyRef.current = false;
                                                        const selectedRows = visibleRows
                                                            .filter((candidate) => next.includes(candidate.id))
                                                            .map((candidate) => candidate.original);
                                                        onEvent({
                                                            type: 'selected',
                                                            rowIds: next,
                                                            rows: selectedRows,
                                                            target: event.target,
                                                        });
                                                        onEvent({
                                                            type: 'contextMenu',
                                                            row: row.original,
                                                            column: columnId,
                                                            value: cell.getValue(),
                                                            target: event.target,
                                                        });
                                                    }}
                                                >
                                                    {isPrimitive ? (
                                                        <Text Component="span" className={styles.cellText}>
                                                            {renderedCell}
                                                        </Text>
                                                    ) : (
                                                        renderedCell
                                                    )}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                );
                            })
                        )}
                        </tbody>
                    </table>

                    {loading && (
                        <div className={styles.loadingOverlay}>
                            <Spinner size="l"/>
                        </div>
                    )}
                </div>
            </div>

            {dragGhost &&
                createPortal(
                    <div
                        className={styles.dragGhost}
                        style={{
                            width: dragGhost.width,
                            height: dragGhost.height,
                            left: dragGhost.x,
                            top: dragGhost.y,
                        }}
                        dangerouslySetInnerHTML={{__html: dragGhost.html}}
                    />,
                    document.body,
                )}

            <div className={styles.pagination}>
                <Button
                    size="m"
                    mode="secondary"
                    className={styles.paginationIconButton}
                    before={<Icon16ChevronLeft/>}
                    disabled={page === 0}
                    onClick={(event) => onEvent({type: 'pageChange', page: page - 1, target: event.target})}
                />

                <div className={styles.pageRail}>
                    {jumpMode ? (
                        <div className={styles.jumpWrap}>
                            <Input
                                type="number"
                                min={1}
                                max={pageCount}
                                value={jumpValue}
                                className={styles.jumpInput}
                                onChange={(event) => setJumpValue(event.target.value)}
                                onWheel={(event) => {
                                    event.preventDefault();
                                    const delta = event.deltaY > 0 ? -1 : 1;
                                    const next = Math.min(pageCount, Math.max(1, Number(jumpValue || currentPage) + delta));
                                    setJumpValue(String(next));
                                }}
                            />
                            <Button
                                size="m"
                                mode="secondary"
                                className={styles.paginationIconButton}
                                before={<Icon16Cancel/>}
                                onClick={() => setJumpMode(null)}
                            />
                            <Button
                                size="m"
                                mode="primary"
                                className={styles.paginationIconButton}
                                before={<Icon16CheckOutline/>}
                                onClick={submitJump}
                            />
                        </div>
                    ) : (
                        paginationItems.map((item) => {
                            if (typeof item === 'number') {
                                const isActive = item === currentPage;
                                return (
                                    <button
                                        key={item}
                                        type="button"
                                        className={classNames(styles.pageButton, isActive && styles.pageButtonActive)}
                                        onClick={(event) => onEvent({
                                            type: 'pageChange',
                                            page: item - 1,
                                            target: event.target
                                        })}
                                    >
                                        {item}
                                    </button>
                                );
                            }

                            return (
                                <button
                                    key={item}
                                    type="button"
                                    className={styles.pageEllipsis}
                                    onClick={() => setJumpMode(item === 'ellipsis-left' ? 'left' : 'right')}
                                >
                                    ...
                                </button>
                            );
                        })
                    )}
                </div>

                <Button
                    size="m"
                    mode="secondary"
                    className={styles.paginationIconButton}
                    before={<Icon16ArrowRightOutline/>}
                    disabled={page + 1 >= pageCount}
                    onClick={(event) => onEvent({type: 'pageChange', page: page + 1, target: event.target})}
                />

                <Select
                    className={styles.pageSizeSelect}
                    value={String(pageSize)}
                    options={PAGE_SIZE_OPTIONS.map((size) => ({
                        label: `${size} строк`,
                        value: String(size),
                    }))}
                    onChange={(event) =>
                        onEvent({
                            type: 'pageSizeChange',
                            pageSize: Number(event.target.value),
                            target: event.target,
                        })
                    }
                />
            </div>

            {headerContextColumnId && (
                <>
                    <div
                        ref={headerContextToggleRef}
                        style={{
                            position: 'fixed',
                            left: `${headerContextPoint.x}px`,
                            top: `${headerContextPoint.y}px`,
                            width: 1,
                            height: 1,
                            pointerEvents: 'none',
                        }}
                    />
                    <ActionSheet
                        onClosed={() => {
                        }}
                        onClose={() => setHeaderContextColumnId(null)}
                        toggleRef={headerContextToggleRef}
                    >
                        <ActionSheetItem
                            onClick={() => {
                                sortDirtyRef.current = true;
                                setSorting([]);
                                setHeaderContextColumnId(null);
                            }}
                        >
                            Сбросить сортировку
                        </ActionSheetItem>
                        <ActionSheetItem
                            onClick={() => {
                                resetCurrentColumnSorting(headerContextColumnId);
                                setHeaderContextColumnId(null);
                            }}
                        >
                            Сбросить сортировку колонки
                        </ActionSheetItem>
                        <ActionSheetItem
                            onClick={() => {
                                resetTableSettings();
                                setHeaderContextColumnId(null);
                            }}
                        >
                            Сбросить настройки таблицы
                        </ActionSheetItem>
                        <ActionSheetItem
                            onClick={() => {
                                resetCurrentColumnSettings(headerContextColumnId);
                                setHeaderContextColumnId(null);
                            }}
                        >
                            Сбросить настройки колонки
                        </ActionSheetItem>
                    </ActionSheet>
                </>
            )}
        </Card>
    );
}

export default Table;
