import React, {useEffect, useEffectEvent, useMemo, useRef, useState} from 'react';
import {createPortal} from 'react-dom';
import {
    type ColumnDef,
    type ColumnOrderState,
    type ColumnSizingState,
    flexRender,
    functionalUpdate,
    getCoreRowModel,
    useReactTable,
} from '@tanstack/react-table';
import {
    ActionSheet,
    ActionSheetItem,
    Placeholder,
    Spinner,
    Text,
    classNames,
} from '@vkontakte/vkui';
import {
    Icon16SortArrowDown,
    Icon16SortArrowUp,
    Icon16SortOutline,
} from '@vkontakte/icons';
import {
    applyColumnSizingPreview,
    areArraysEqual,
    areColumnSizingEqual,
    areSortingsEqual,
    buildPagination,
    clampColumnWidth,
    DEFAULT_COLUMN_MAX_SIZE,
    DEFAULT_COLUMN_MIN_SIZE,
    DEFAULT_COLUMN_SIZE,
    DRAG_START_THRESHOLD,
    EMPTY_STATE,
    getColumnDefaultWidth,
    getColumnMaxWidth,
    getColumnMinWidth,
    getDefaultRowId,
    getRange,
    getStorageId,
    getStoredSettings,
    isInteractiveTarget,
    moveColumnOrder,
    PAGE_SIZE_OPTIONS,
    removeStoredSettings,
    renderContent,
    restoreColumnOrderFromDefaults,
    saveStoredSettings,
    sortingStateToTableSorting,
    TABLE_TOTAL_WIDTH_CSS_VAR,
    tableSortingToSortingState,
} from './helpers';
import styles from './Table.module.scss';
import bodyStyles from './TableBody/TableBody.module.scss';
import TableBody from './TableBody/TableBody';
import TableFooter from './TableFooter/TableFooter';
import TableHeader from './TableHeader/TableHeader';
import headerStyles from './TableHeader/TableHeader.module.scss';
import type {
    ColumnDragInteraction,
    ColumnResizeInteraction,
    DragGhostState,
    SelectionState,
    TableProps,
    TableRow,
    TableSorting,
    TableSettings,
} from './types';

const Table = (props: TableProps) => {

    const {
        disabled,
        tableId,
        componentName,
        data,
        columns,
        total,
        page,
        rows,
        loading = false,
        onEvent,
        getRowId,
        emptyState,
    } = props;

    const storageId = useMemo(() => getStorageId(tableId, componentName), [componentName, tableId]);
    const settingsKey = useMemo(() => `table_settings_${storageId}`, [storageId]);
    const availableColumnIds = useMemo(() => columns.map((column) => column.key), [columns]);
    const columnMap = useMemo(() => new Map(columns.map((column) => [column.key, column])), [columns]);

    const [sorting, setSorting] = useState<TableSorting>(null);
    const [columnOrder, setColumnOrder] = useState<ColumnOrderState>(() => availableColumnIds);
    const [columnSizing, setColumnSizing] = useState<ColumnSizingState>({});
    const [selectedRowIds, setSelectedRowIds] = useState<string[]>([]);
    const [draggingColumnId, setDraggingColumnId] = useState<string | null>(null);
    const [dragGhost, setDragGhost] = useState<DragGhostState>(null);
    const [resizingColumnId, setResizingColumnId] = useState<string | null>(null);
    const [headerContextColumnId, setHeaderContextColumnId] = useState<string | null>(null);
    const [headerContextPoint, setHeaderContextPoint] = useState({x: 0, y: 0});
    const [jumpMode, setJumpMode] = useState<null | 'left' | 'right'>(null);
    const [jumpValue, setJumpValue] = useState('1');
    const [settingsReady, setSettingsReady] = useState(false);

    const onEventRef = useRef(onEvent);
    const visibleRowsRef = useRef<Array<{id: string; original: TableRow}>>([]);
    const selectedRowIdsRef = useRef<string[]>([]);
    const selectionAnchorRowIdRef = useRef<string | null>(null);
    const selectionStateRef = useRef<SelectionState>({
        active: false,
        dirty: false,
        target: null as EventTarget | null,
    });
    const sortingRef = useRef<TableSorting>(null);
    const resolvedColumnOrderRef = useRef<string[]>(availableColumnIds);
    const previewColumnOrderRef = useRef<string[]>(availableColumnIds);
    const committedColumnSizingRef = useRef<ColumnSizingState>({});
    const liveColumnSizingRef = useRef<ColumnSizingState>({});
    const pendingSortTargetRef = useRef<EventTarget | null>(null);
    const resizeActiveRef = useRef(false);
    const headerCellRefsRef = useRef<Record<string, HTMLTableCellElement | null>>({});
    const tableRef = useRef<HTMLTableElement>(null);
    const scrollRef = useRef<HTMLDivElement>(null);
    const dragInteractionRef = useRef<ColumnDragInteraction>(null);
    const resizeInteractionRef = useRef<ColumnResizeInteraction>(null);
    const dragGhostRef = useRef<HTMLDivElement>(null);
    const bodyStyleSnapshotRef = useRef<{userSelect: string; cursor: string} | null>(null);
    const headerContextToggleRef = useRef<HTMLDivElement>(null);
    const rowRefsRef = useRef<Record<string, HTMLTableRowElement | null>>({});
    const previewSelectedRowIdsRef = useRef<string[]>([]);

    const emitCellClick = (params: {
        row: TableRow;
        column: string;
        value: unknown;
        event: React.MouseEvent<HTMLElement>;
        target: EventTarget | null;
    }) => {
        onEventRef.current({
            type: 'cellClick',
            row: params.row,
            column: params.column,
            value: params.value,
            event: params.event,
            target: params.target,
        });
    };

    const emitCellDoubleClick = (params: {
        row: TableRow;
        column: string;
        value: unknown;
        event: React.MouseEvent<HTMLElement>;
        target: EventTarget | null;
    }) => {
        onEventRef.current({
            type: 'cellDoubleClick',
            row: params.row,
            column: params.column,
            value: params.value,
            event: params.event,
            target: params.target,
        });
    };

    const emitInteractiveClick = (
        type: 'button' | 'download',
        params: {
            row: TableRow;
            column: string;
            value: unknown;
            event: React.MouseEvent<HTMLElement>;
            target: EventTarget | null;
        },
    ) => {
        onEventRef.current({
            type,
            row: params.row,
            column: params.column,
            value: params.value,
            event: params.event,
            target: params.target,
        });
    };

    const emitBooleanChange = (params: {
        row: TableRow;
        column: string;
        value: unknown;
        nextValue: unknown;
        event: React.ChangeEvent<HTMLInputElement>;
        target: EventTarget | null;
    }) => {
        onEventRef.current({
            type: 'boolean',
            row: params.row,
            column: params.column,
            value: params.value,
            nextValue: params.nextValue,
            event: params.event,
            target: params.target,
        });
    };

    const resolvedColumnOrder = useMemo(() => {
        const filtered = columnOrder.filter((columnId) => availableColumnIds.includes(columnId));
        const missing = availableColumnIds.filter((columnId) => !filtered.includes(columnId));
        return [...filtered, ...missing];
    }, [availableColumnIds, columnOrder]);

    const tableColumns = useMemo<ColumnDef<TableRow>[]>(() => {
        return columns.map((column) => ({
            id: column.key,
            accessorFn: (row) => row[column.key],
            header: () => column.header ?? '',
            size: getColumnDefaultWidth(column),
            minSize: getColumnMinWidth(column),
            maxSize: getColumnMaxWidth(column),
            cell: (info) => {
                if (column.render) {
                    return column.render(info.getValue(), info.row.original);
                }

                return info.getValue() as React.ReactNode;
            },
        }));
    }, [columns]);

    const commitColumnSizing = (nextSizing: ColumnSizingState) => {
        const normalizedSizing: ColumnSizingState = {};

        columns.forEach((column) => {
            const width = nextSizing[column.key];

            if (typeof width !== 'number') {
                return;
            }

            const normalizedWidth = clampColumnWidth(width, column);

            if (normalizedWidth !== getColumnDefaultWidth(column)) {
                normalizedSizing[column.key] = normalizedWidth;
            }
        });

        const previousSizing = committedColumnSizingRef.current;
        committedColumnSizingRef.current = normalizedSizing;
        liveColumnSizingRef.current = {...normalizedSizing};
        applyColumnSizingPreview(tableRef.current, columns, normalizedSizing);

        if (!areColumnSizingEqual(previousSizing, normalizedSizing)) {
            setColumnSizing(normalizedSizing);
        }
    };

    const applyPreviewColumnOrder = (nextOrder: string[]) => {
        const tableElement = tableRef.current;

        if (!tableElement) {
            return;
        }

        const rows = tableElement.querySelectorAll('thead tr, tbody tr');

        rows.forEach((row) => {
            const cells = Array.from(row.children).filter(
                (cell): cell is HTMLTableCellElement =>
                    cell instanceof HTMLTableCellElement && typeof cell.dataset.columnId === 'string',
            );

            if (cells.length === 0) {
                return;
            }

            const cellsByColumnId = new Map(cells.map((cell) => [cell.dataset.columnId as string, cell]));

            nextOrder.forEach((columnId) => {
                const cell = cellsByColumnId.get(columnId);

                if (cell) {
                    row.appendChild(cell);
                }
            });
        });
    };

    const tableSortingState = useMemo(() => tableSortingToSortingState(sorting), [sorting]);

    const applySorting = (nextSorting: TableSorting, target: EventTarget | null, force = false) => {
        if (!force && areSortingsEqual(sortingRef.current, nextSorting)) {
            pendingSortTargetRef.current = null;
            return;
        }

        sortingRef.current = nextSorting;
        setSorting(nextSorting);
        onEventRef.current({
            type: 'sortChange',
            sorting: nextSorting,
            target,
        });
        pendingSortTargetRef.current = null;
    };

    const table = useReactTable<TableRow>({
        data,
        columns: tableColumns,
        state: {
            sorting: tableSortingState,
            columnOrder: resolvedColumnOrder,
            columnSizing,
        },
        manualSorting: true,
        onSortingChange: (updater) => {
            const nextSorting = sortingStateToTableSorting(
                functionalUpdate(updater, tableSortingToSortingState(sortingRef.current)),
            );
            applySorting(nextSorting, pendingSortTargetRef.current);
        },
        onColumnOrderChange: setColumnOrder,
        onColumnSizingChange: setColumnSizing,
        getCoreRowModel: getCoreRowModel(),
        columnResizeMode: 'onEnd',
        defaultColumn: {
            size: DEFAULT_COLUMN_SIZE,
            minSize: DEFAULT_COLUMN_MIN_SIZE,
            maxSize: DEFAULT_COLUMN_MAX_SIZE,
        },
        getRowId: (row, index) => {
            if (getRowId) {
                return getRowId(row, index);
            }

            return getDefaultRowId(row, index);
        },
    });

    const safeRows = rows > 0 ? rows : PAGE_SIZE_OPTIONS[0];
    const pageCount = Math.max(1, Math.ceil(total / safeRows));
    const pageIndex = Math.min(Math.max(page, 0), pageCount - 1);
    const currentPage = pageIndex + 1;
    const visibleRows = table.getRowModel().rows;
    const visibleRowIds = useMemo(() => visibleRows.map((row) => row.id), [visibleRows]);
    const selectedRowIdsSet = useMemo(() => new Set(selectedRowIds), [selectedRowIds]);
    const paginationItems = useMemo(() => buildPagination(currentPage, pageCount), [currentPage, pageCount]);
    const dragGhostHeader = draggingColumnId
        ? table.getFlatHeaders().find((header) => header.column.id === draggingColumnId) ?? null
        : null;

    useEffect(() => {
        onEventRef.current = onEvent;
    }, [onEvent]);

    useEffect(() => {
        visibleRowsRef.current = visibleRows;
    }, [visibleRows]);

    useEffect(() => {
        selectedRowIdsRef.current = selectedRowIds;
        previewSelectedRowIdsRef.current = selectedRowIds;
    }, [selectedRowIds]);

    useEffect(() => {
        sortingRef.current = sorting;
    }, [sorting]);

    useEffect(() => {
        resolvedColumnOrderRef.current = resolvedColumnOrder;

        if (!dragInteractionRef.current?.started) {
            previewColumnOrderRef.current = resolvedColumnOrder;
        }
    }, [resolvedColumnOrder]);

    useEffect(() => {
        committedColumnSizingRef.current = columnSizing;
        liveColumnSizingRef.current = {...columnSizing};
        applyColumnSizingPreview(tableRef.current, columns, columnSizing);
    }, [columnSizing, columns]);

    useEffect(() => {
        const storedSettings = getStoredSettings(settingsKey);
        const nextSorting = storedSettings.reduce<TableSorting>((result, item) => {
            if (result) {
                return result;
            }

            if (
                availableColumnIds.includes(item.key)
                && (item.settings.sort === 'asc' || item.settings.sort === 'desc')
            ) {
                return {
                    id: item.key,
                    sort: item.settings.sort,
                };
            }

            return null;
        }, null);
        const storedOrder = storedSettings
            .map((item) => item.key)
            .filter((columnId) => availableColumnIds.includes(columnId));
        const missingColumnIds = availableColumnIds.filter((columnId) => !storedOrder.includes(columnId));
        const nextSizing: ColumnSizingState = {};

        storedSettings.forEach((item) => {
            if (availableColumnIds.includes(item.key) && typeof item.settings.width === 'number') {
                nextSizing[item.key] = item.settings.width;
            }
        });

        setSettingsReady(false);
        sortingRef.current = nextSorting;
        resolvedColumnOrderRef.current = [...storedOrder, ...missingColumnIds];
        previewColumnOrderRef.current = [...storedOrder, ...missingColumnIds];
        committedColumnSizingRef.current = nextSizing;
        liveColumnSizingRef.current = {...nextSizing};
        setSorting(nextSorting);
        setColumnOrder([...storedOrder, ...missingColumnIds]);
        setColumnSizing(nextSizing);

        if (nextSorting) {
            onEventRef.current({
                type: 'sortChange',
                sorting: nextSorting,
                target: null,
            });
        }

        commitSelectedRows([]);
        selectionAnchorRowIdRef.current = null;
        selectionStateRef.current.active = false;
        selectionStateRef.current.dirty = false;
        setSettingsReady(true);
    }, [availableColumnIds, settingsKey]);

    useEffect(() => {
        if (!settingsReady) {
            return;
        }

        const timeoutId = window.setTimeout(() => {
            const payload: TableSettings = resolvedColumnOrder.map((columnId) => ({
                key: columnId,
                settings: {
                    width: typeof columnSizing[columnId] === 'number' ? columnSizing[columnId] : undefined,
                    sort: sorting?.id === columnId ? sorting.sort : null,
                },
            }));

            saveStoredSettings(settingsKey, payload);
        }, 180);

        return () => window.clearTimeout(timeoutId);
    }, [columnSizing, resolvedColumnOrder, settingsKey, settingsReady, sorting]);

    useEffect(() => {
        const visibleRowIdSet = new Set(visibleRowIds);
        const nextSelectedRowIds = selectedRowIdsRef.current.filter((rowId) => visibleRowIdSet.has(rowId));

        if (!areArraysEqual(nextSelectedRowIds, selectedRowIdsRef.current)) {
            commitSelectedRows(nextSelectedRowIds);
        }

        if (
            selectionAnchorRowIdRef.current
            && !visibleRowIdSet.has(selectionAnchorRowIdRef.current)
        ) {
            selectionAnchorRowIdRef.current = null;
        }
    }, [visibleRowIds]);

    useEffect(() => {
        setJumpValue(String(currentPage));
    }, [currentPage]);

    const restoreBodyInteractionStyles = () => {
        if (!bodyStyleSnapshotRef.current) {
            return;
        }

        document.body.style.userSelect = bodyStyleSnapshotRef.current.userSelect;
        document.body.style.cursor = bodyStyleSnapshotRef.current.cursor;
        bodyStyleSnapshotRef.current = null;
    };

    const startBodyInteractionStyles = (cursor: string) => {
        if (!bodyStyleSnapshotRef.current) {
            bodyStyleSnapshotRef.current = {
                userSelect: document.body.style.userSelect,
                cursor: document.body.style.cursor,
            };
        }

        document.body.style.userSelect = 'none';
        document.body.style.cursor = cursor;
    };

    const syncSelectedRowsPreview = (nextRowIds: string[]) => {
        const previousRowIdSet = new Set(previewSelectedRowIdsRef.current);
        const nextRowIdSet = new Set(nextRowIds);

        previousRowIdSet.forEach((rowId) => {
            if (nextRowIdSet.has(rowId)) {
                return;
            }

            rowRefsRef.current[rowId]?.classList.remove(bodyStyles['bodyRow--selected']);
        });

        nextRowIdSet.forEach((rowId) => {
            if (previousRowIdSet.has(rowId)) {
                return;
            }

            rowRefsRef.current[rowId]?.classList.add(bodyStyles['bodyRow--selected']);
        });

        previewSelectedRowIdsRef.current = nextRowIds;
    };

    const previewSelectedRows = (nextRowIds: string[]) => {
        const normalizedRowIds = Array.from(new Set(nextRowIds));

        if (areArraysEqual(selectedRowIdsRef.current, normalizedRowIds)) {
            syncSelectedRowsPreview(normalizedRowIds);
            return false;
        }

        selectedRowIdsRef.current = normalizedRowIds;
        syncSelectedRowsPreview(normalizedRowIds);
        return true;
    };

    const commitSelectedRows = (nextRowIds: string[]) => {
        const normalizedRowIds = Array.from(new Set(nextRowIds));
        selectedRowIdsRef.current = normalizedRowIds;
        syncSelectedRowsPreview(normalizedRowIds);
        setSelectedRowIds((previousRowIds) => (
            areArraysEqual(previousRowIds, normalizedRowIds) ? previousRowIds : normalizedRowIds
        ));
    };

    const stopColumnResizing = useEffectEvent((shouldCommit: boolean) => {
        const interaction = resizeInteractionRef.current;

        if (interaction && interaction.frameId !== null) {
            window.cancelAnimationFrame(interaction.frameId);
        }

        if (interaction && shouldCommit) {
            commitColumnSizing({
                ...committedColumnSizingRef.current,
                [interaction.columnId]: interaction.currentWidth,
            });
        } else {
            liveColumnSizingRef.current = {...committedColumnSizingRef.current};
            applyColumnSizingPreview(tableRef.current, columns, committedColumnSizingRef.current);
        }

        resizeInteractionRef.current = null;
        setResizingColumnId(null);
        resizeActiveRef.current = false;
        restoreBodyInteractionStyles();
    });

    useEffect(() => {
        const onMouseUp = () => {
            if (resizeInteractionRef.current) {
                stopColumnResizing(true);
            }

            if (!selectionStateRef.current.active) {
                return;
            }

            selectionStateRef.current.active = false;

            if (!selectionStateRef.current.dirty) {
                selectionStateRef.current.target = null;
                return;
            }

            selectionStateRef.current.dirty = false;
            commitSelectedRows(selectedRowIdsRef.current);
            const nextSelectedRows = visibleRowsRef.current
                .filter((row) => selectedRowIdsRef.current.includes(row.id))
                .map((row) => row.original);

            onEventRef.current({
                type: 'selected',
                rowIds: selectedRowIdsRef.current,
                rows: nextSelectedRows,
                target: selectionStateRef.current.target,
            });

            selectionStateRef.current.target = null;
        };

        window.addEventListener('mouseup', onMouseUp);
        return () => window.removeEventListener('mouseup', onMouseUp);
    }, []);

    const stopColumnDragging = useEffectEvent((shouldCommit: boolean) => {
        const interaction = dragInteractionRef.current;
        const committedOrder = resolvedColumnOrderRef.current;
        const previewOrder = previewColumnOrderRef.current;

        if (interaction && interaction.ghostFrameId !== null) {
            window.cancelAnimationFrame(interaction.ghostFrameId);
        }

        dragInteractionRef.current = null;
        setDraggingColumnId(null);
        setDragGhost(null);
        restoreBodyInteractionStyles();

        if (shouldCommit) {
            if (!areArraysEqual(previewOrder, committedOrder)) {
                resolvedColumnOrderRef.current = previewOrder;
                setColumnOrder(previewOrder);
            }

            return;
        }

        previewColumnOrderRef.current = committedOrder;

        if (!areArraysEqual(previewOrder, committedOrder)) {
            applyPreviewColumnOrder(committedOrder);
        }
    });

    const scheduleGhostPosition = useEffectEvent((clientX: number) => {
        const interaction = dragInteractionRef.current;

        if (!interaction) {
            return;
        }

        interaction.currentX = clientX;

        if (interaction.ghostFrameId !== null) {
            return;
        }

        interaction.ghostFrameId = window.requestAnimationFrame(() => {
            const nextInteraction = dragInteractionRef.current;

            if (!nextInteraction) {
                return;
            }

            nextInteraction.ghostFrameId = null;

            if (dragGhostRef.current) {
                dragGhostRef.current.style.left = `${nextInteraction.currentX - nextInteraction.offsetX}px`;
            }
        });
    });

    const scheduleResizePreview = useEffectEvent((nextWidth: number) => {
        const interaction = resizeInteractionRef.current;

        if (!interaction) {
            return;
        }

        interaction.currentWidth = nextWidth;

        if (interaction.frameId !== null) {
            return;
        }

        interaction.frameId = window.requestAnimationFrame(() => {
            const nextInteraction = resizeInteractionRef.current;

            if (!nextInteraction) {
                return;
            }

            nextInteraction.frameId = null;

            const nextSizing = {
                ...committedColumnSizingRef.current,
                [nextInteraction.columnId]: nextInteraction.currentWidth,
            };

            liveColumnSizingRef.current = nextSizing;
            applyColumnSizingPreview(tableRef.current, columns, nextSizing);
        });
    });

    const reorderDraggedColumn = useEffectEvent((clientX: number) => {
        const interaction = dragInteractionRef.current;

        if (!interaction || !interaction.started) {
            return;
        }

        const currentOrder = previewColumnOrderRef.current;
        let nextOrder = currentOrder;
        let currentIndex = nextOrder.indexOf(interaction.columnId);

        if (currentIndex < 0) {
            return;
        }

        while (currentIndex > 0) {
            const leftColumnId = nextOrder[currentIndex - 1];
            const leftCell = headerCellRefsRef.current[leftColumnId];

            if (!leftCell) {
                break;
            }

            const leftRect = leftCell.getBoundingClientRect();

            if (clientX >= leftRect.left + leftRect.width / 2) {
                break;
            }

            nextOrder = moveColumnOrder(nextOrder, interaction.columnId, leftColumnId, false);
            currentIndex -= 1;
        }

        while (currentIndex < nextOrder.length - 1) {
            const rightColumnId = nextOrder[currentIndex + 1];
            const rightCell = headerCellRefsRef.current[rightColumnId];

            if (!rightCell) {
                break;
            }

            const rightRect = rightCell.getBoundingClientRect();

            if (clientX <= rightRect.left + rightRect.width / 2) {
                break;
            }

            nextOrder = moveColumnOrder(nextOrder, interaction.columnId, rightColumnId, true);
            currentIndex += 1;
        }

        if (!areArraysEqual(nextOrder, currentOrder)) {
            previewColumnOrderRef.current = nextOrder;
            applyPreviewColumnOrder(nextOrder);
        }
    });

    const handleResizeMouseMove = useEffectEvent((event: MouseEvent) => {
        const interaction = resizeInteractionRef.current;

        if (!interaction) {
            return;
        }

        event.preventDefault();

        const nextWidth = Math.min(
            interaction.maxWidth,
            Math.max(interaction.minWidth, Math.round(interaction.startWidth + (event.clientX - interaction.startX))),
        );

        if (nextWidth === interaction.currentWidth) {
            return;
        }

        scheduleResizePreview(nextWidth);
    });

    const handleColumnMouseMove = useEffectEvent((event: MouseEvent) => {
        const interaction = dragInteractionRef.current;

        if (!interaction || resizeInteractionRef.current) {
            return;
        }

        const deltaX = event.clientX - interaction.startX;
        const deltaY = event.clientY - interaction.startY;

        if (!interaction.started) {
            if (Math.abs(deltaX) < DRAG_START_THRESHOLD && Math.abs(deltaY) < DRAG_START_THRESHOLD) {
                return;
            }

            interaction.started = true;
            previewColumnOrderRef.current = resolvedColumnOrderRef.current;
            startBodyInteractionStyles('grabbing');
            setDraggingColumnId(interaction.columnId);
            setDragGhost({
                columnId: interaction.columnId,
                width: interaction.width,
                height: interaction.height,
                top: interaction.top + 1,
                left: interaction.startX - interaction.offsetX,
            });
        }

        event.preventDefault();
        scheduleGhostPosition(event.clientX);
        reorderDraggedColumn(event.clientX);
    });

    const handleColumnMouseUp = useEffectEvent((event: MouseEvent) => {
        const interaction = dragInteractionRef.current;

        if (!interaction) {
            return;
        }

        const shouldToggleSort = !interaction.started;
        const columnId = interaction.columnId;
        const target = interaction.target;

        stopColumnDragging(interaction.started);

        if (!shouldToggleSort || event.button !== 0) {
            return;
        }

        pendingSortTargetRef.current = target;
        table.getColumn(columnId)?.toggleSorting(undefined, false);
    });

    const handleWindowBlur = useEffectEvent(() => {
        if (resizeInteractionRef.current) {
            stopColumnResizing(true);
        }

        if (dragInteractionRef.current) {
            stopColumnDragging(Boolean(dragInteractionRef.current.started));
        }
    });

    useEffect(() => {
        window.addEventListener('mousemove', handleResizeMouseMove);
        window.addEventListener('mousemove', handleColumnMouseMove);
        window.addEventListener('mouseup', handleColumnMouseUp);
        window.addEventListener('blur', handleWindowBlur);

        return () => {
            window.removeEventListener('mousemove', handleResizeMouseMove);
            window.removeEventListener('mousemove', handleColumnMouseMove);
            window.removeEventListener('mouseup', handleColumnMouseUp);
            window.removeEventListener('blur', handleWindowBlur);
        };
    }, []);

    const setSelectedRows = (nextRowIds: string[]) => {
        return previewSelectedRows(nextRowIds);
    };

    const getNextRowSelection = (
        rowId: string,
        event: {
            shiftKey?: boolean;
            ctrlKey?: boolean;
            metaKey?: boolean;
        } | null,
    ) => {
        if (event?.shiftKey && selectionAnchorRowIdRef.current) {
            return getRange(visibleRowIds, selectionAnchorRowIdRef.current, rowId);
        }

        if (event && (event.ctrlKey || event.metaKey)) {
            selectionAnchorRowIdRef.current = rowId;

            if (selectedRowIdsRef.current.includes(rowId)) {
                return selectedRowIdsRef.current.filter((value) => value !== rowId);
            }

            return [...selectedRowIdsRef.current, rowId];
        }

        selectionAnchorRowIdRef.current = rowId;
        return [rowId];
    };

    const beginSelection = (rowId: string, event: React.MouseEvent<HTMLTableRowElement>) => {
        if (event.button !== 0 || isInteractiveTarget(event.target)) {
            return;
        }

        const selectionChanged = setSelectedRows(getNextRowSelection(rowId, event));

        event.preventDefault();
        selectionStateRef.current.active = true;
        selectionStateRef.current.target = event.target;
        selectionStateRef.current.dirty = selectionChanged;
    };

    const extendSelection = (rowId: string, target: EventTarget | null) => {
        if (!selectionStateRef.current.active || !selectionAnchorRowIdRef.current) {
            return;
        }

        const nextSelection = getRange(visibleRowIds, selectionAnchorRowIdRef.current, rowId);

        if (setSelectedRows(nextSelection)) {
            selectionStateRef.current.dirty = true;
            selectionStateRef.current.target = target;
        }
    };

    const emitSelectedRows = (target: EventTarget | null) => {
        const nextSelectedRows = visibleRows
            .filter((row) => selectedRowIdsRef.current.includes(row.id))
            .map((row) => row.original);

        onEventRef.current({
            type: 'selected',
            rowIds: selectedRowIdsRef.current,
            rows: nextSelectedRows,
            target,
        });
    };

    const resetCurrentColumnSettings = (columnId: string) => {
        if (sortingRef.current?.id === columnId) {
            applySorting(null, null);
        }

        const nextSizing = {...committedColumnSizingRef.current};
        delete nextSizing[columnId];
        commitColumnSizing(nextSizing);

        const nextColumnOrder = restoreColumnOrderFromDefaults(
            resolvedColumnOrderRef.current,
            availableColumnIds,
            columnId,
        );

        if (!areArraysEqual(nextColumnOrder, resolvedColumnOrderRef.current)) {
            resolvedColumnOrderRef.current = nextColumnOrder;
            previewColumnOrderRef.current = nextColumnOrder;
            applyPreviewColumnOrder(nextColumnOrder);
            setColumnOrder(nextColumnOrder);
        }
    };

    const resetTableSettings = () => {
        const nextColumnOrder = columns.map((column) => column.key);

        applySorting(null, null);
        commitColumnSizing({});
        resolvedColumnOrderRef.current = nextColumnOrder;
        previewColumnOrderRef.current = nextColumnOrder;
        applyPreviewColumnOrder(nextColumnOrder);
        setColumnOrder(nextColumnOrder);
        selectionStateRef.current.active = false;
        selectionStateRef.current.dirty = false;
        removeStoredSettings(settingsKey);
    };

    const submitJump = () => {
        const nextPage = Number(jumpValue);

        if (!Number.isFinite(nextPage)) {
            return;
        }

        const clampedPage = Math.min(pageCount, Math.max(1, Math.round(nextPage)));
        setJumpMode(null);

        if (clampedPage - 1 === pageIndex) {
            return;
        }

        onEventRef.current({
            type: 'pageChange',
            page: clampedPage - 1,
            target: null,
        });
    };

    const beginColumnResize = (columnId: string, event: React.MouseEvent<HTMLDivElement>) => {
        if (loading || event.button !== 0 || dragInteractionRef.current || resizeActiveRef.current) {
            return;
        }

        const cell = headerCellRefsRef.current[columnId];

        if (!cell) {
            return;
        }

        const column = columnMap.get(columnId);
        const startWidth = clampColumnWidth(cell.getBoundingClientRect().width, column);

        resizeInteractionRef.current = {
            columnId,
            startX: event.clientX,
            startWidth,
            currentWidth: startWidth,
            minWidth: getColumnMinWidth(column),
            maxWidth: getColumnMaxWidth(column),
            frameId: null,
        };
        resizeActiveRef.current = true;
        setResizingColumnId(columnId);
        startBodyInteractionStyles('col-resize');
        event.preventDefault();
        event.stopPropagation();
    };

    const beginColumnInteraction = (columnId: string, event: React.MouseEvent<HTMLDivElement>) => {
        if (loading || event.button !== 0 || resizeActiveRef.current || resizeInteractionRef.current) {
            return;
        }

        const cell = headerCellRefsRef.current[columnId];

        if (!cell) {
            return;
        }

        const rect = cell.getBoundingClientRect();

        dragInteractionRef.current = {
            columnId,
            startX: event.clientX,
            startY: event.clientY,
            currentX: event.clientX,
            started: false,
            offsetX: event.clientX - rect.left,
            top: rect.top - 1,
            width: rect.width,
            height: rect.height,
            target: event.target,
            ghostFrameId: null,
        };
        previewColumnOrderRef.current = resolvedColumnOrderRef.current;

        event.preventDefault();
    };

    return (
        <>
            <div
                className={classNames(
                    'island',
                    styles.wrap,
                )}
            >
                <div
                    ref={scrollRef}
                    className={classNames(
                        'scroll',
                        styles.scroll,
                        (loading || !visibleRows.length) && styles['scroll--disabled'],
                        draggingColumnId && styles.scrollDragging,
                    )}
                >
                    <table
                        ref={tableRef}
                        className={styles.table}
                        style={{width: `var(${TABLE_TOTAL_WIDTH_CSS_VAR}, ${table.getTotalSize()}px)`}}
                    >
                        <TableHeader
                            disabled={disabled}
                            loading={loading}
                            headerGroups={table.getHeaderGroups()}
                            draggingColumnId={draggingColumnId}
                            resizingColumnId={resizingColumnId}
                            headerCellRefsRef={headerCellRefsRef}
                            onOpenContextMenu={(columnId, point) => {
                                setHeaderContextColumnId(columnId);
                                setHeaderContextPoint(point);
                            }}
                            beginColumnInteraction={beginColumnInteraction}
                            beginColumnResize={beginColumnResize}
                        />

                        <TableBody
                            disabled={disabled}
                            loading={loading}
                            scrollRef={scrollRef}
                            visibleRows={visibleRows}
                            columnMap={columnMap}
                            draggingColumnId={draggingColumnId}
                            resizingColumnId={resizingColumnId}
                            selectedRowIdsSet={selectedRowIdsSet}
                            rowRefsRef={rowRefsRef}
                            previewSelectedRowIdsRef={previewSelectedRowIdsRef}
                            selectionStateRef={selectionStateRef}
                            onEventRef={onEventRef}
                            beginSelection={beginSelection}
                            extendSelection={extendSelection}
                            getNextRowSelection={getNextRowSelection}
                            setSelectedRows={setSelectedRows}
                            emitSelectedRows={emitSelectedRows}
                            emitCellClick={emitCellClick}
                            emitCellDoubleClick={emitCellDoubleClick}
                            emitInteractiveClick={emitInteractiveClick}
                            emitBooleanChange={emitBooleanChange}
                        />
                    </table>

                    {loading && (
                        <div className={styles.loading}>
                            <Spinner size={'xl'}/>
                        </div>
                    )}
                    {(visibleRows.length === 0 && !loading) && (
                        <Placeholder
                            className={styles.empty}
                            title={emptyState?.title || EMPTY_STATE.title}
                        >
                            {emptyState?.description && (
                                <Text>
                                    {emptyState.description}
                                </Text>
                            )}
                        </Placeholder>
                    )}
                </div>

                {(dragGhost || resizingColumnId) &&(
                    <div className={classNames(
                        styles.plug,
                        dragGhost && styles['plug--drag'],
                        resizingColumnId && styles['plug--resize']
                    )}/>
                )}
                {dragGhost && dragGhostHeader && createPortal(
                    <div
                        ref={dragGhostRef}
                        className={styles.dragGhost}
                        style={{
                            width: dragGhost.width,
                            height: dragGhost.height,
                            left: dragGhost.left,
                            top: dragGhost.top,
                        }}
                    >
                        <div className={classNames(headerStyles.headerInner, styles.dragGhostInner)}>
                            <Text>
                                {renderContent(
                                    flexRender(dragGhostHeader.column.columnDef.header, dragGhostHeader.getContext()),
                                    headerStyles.headerTitle,
                                )}
                            </Text>
                            {dragGhostHeader.column.getIsSorted() === 'asc' && (
                                <Icon16SortArrowUp fill="var(--vkui--color_icon_tertiary)"/>
                            )}
                            {dragGhostHeader.column.getIsSorted() === 'desc' && (
                                <Icon16SortArrowDown fill="var(--vkui--color_icon_tertiary)"/>
                            )}
                            {!dragGhostHeader.column.getIsSorted() && (
                                <Icon16SortOutline fill="var(--vkui--color_icon_tertiary)"/>
                            )}
                        </div>
                    </div>,
                    document.body,
                )}
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
                        onClosed={() => setHeaderContextColumnId(null)}
                        toggleRef={headerContextToggleRef}
                    >
                        <ActionSheetItem
                            onClick={() => {
                                applySorting(null, null, true);
                            }}
                        >
                            Сбросить сортировку
                        </ActionSheetItem>
                        <ActionSheetItem
                            onClick={() => {
                                if (headerContextColumnId) {
                                    resetCurrentColumnSettings(headerContextColumnId);
                                }
                            }}
                        >
                            Сбросить настройки колонки
                        </ActionSheetItem>
                        <ActionSheetItem
                            onClick={() => {
                                resetTableSettings();
                            }}
                        >
                            Сбросить настройки таблицы
                        </ActionSheetItem>
                    </ActionSheet>
                </>
            )}

            <TableFooter
                disabled={disabled}
                loading={loading}
                safeRows={safeRows}
                pageIndex={pageIndex}
                pageCount={pageCount}
                currentPage={currentPage}
                jumpMode={jumpMode}
                jumpValue={jumpValue}
                paginationItems={paginationItems}
                setJumpMode={setJumpMode}
                setJumpValue={setJumpValue}
                submitJump={submitJump}
                onRowsChange={(nextRows, target) => {
                    onEventRef.current({
                        type: 'rowsChange',
                        rows: nextRows,
                        target,
                    });
                }}
                onPageChange={(nextPage, target) => {
                    onEventRef.current({
                        type: 'pageChange',
                        page: nextPage,
                        target,
                    });
                }}
            />
        </>
    );
};

export default Table;
