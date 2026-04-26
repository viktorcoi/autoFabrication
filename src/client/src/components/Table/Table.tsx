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
    Icon20ListDeleteOutline
} from '@vkontakte/icons';
import {
    applyColumnSizingPreview,
    areArraysEqual,
    areColumnSizingEqual,
    areSortingsEqual,
    buildPagination,
    clampColumnWidth,
    cloneTableRow,
    DEFAULT_COLUMN_MAX_SIZE,
    DEFAULT_COLUMN_MIN_SIZE,
    DEFAULT_COLUMN_SIZE,
    DRAG_START_THRESHOLD,
    getCellTextValue,
    getColumnType,
    getColumnDefaultWidth,
    getColumnMaxWidth,
    getColumnMinWidth,
    getDefaultRowId,
    getMeasuredRowHeight,
    getRange,
    getStorageId,
    getStoredSettings,
    isCellRequired,
    isEmptyCellValue,
    isInteractiveTarget,
    mergeRowDraftChanges,
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
    TableDraftChanges,
    TableProps,
    TableRow,
    TableSorting,
    TableSettings,
} from './types';

const COLUMN_AUTO_SCROLL_EDGE = 72;
const COLUMN_AUTO_SCROLL_MAX_STEP = 18;

const Table = (props: TableProps) => {

    const {
        disabled,
        tableId,
        hideFooter,
        componentName,
        data,
        columns,
        total,
        page,
        rows,
        loading = false,
        selected,
        onEvent,
        getRowId,
        emptyState = {
            title: 'Данные отсутсвуют',
            description: 'Нет данных для отображения',
            icon: <Icon20ListDeleteOutline width={62} height={62} />
        },
    } = props;

    const storageId = useMemo(() => getStorageId(tableId, componentName), [componentName, tableId]);
    const settingsKey = useMemo(() => `table_settings_${storageId}`, [storageId]);
    const availableColumnIds = useMemo(() => columns.map((column) => column.key), [columns]);
    const columnMap = useMemo(() => new Map(columns.map((column) => [column.key, column])), [columns]);

    const [sorting, setSorting] = useState<TableSorting>(null);
    const [columnOrder, setColumnOrder] = useState<ColumnOrderState>(() => availableColumnIds);
    const [columnSizing, setColumnSizing] = useState<ColumnSizingState>({});
    const [selectedRowIds, setSelectedRowIds] = useState<number[]>([]);
    const [draggingColumnId, setDraggingColumnId] = useState<string | null>(null);
    const [dragGhost, setDragGhost] = useState<DragGhostState>(null);
    const [resizingColumnId, setResizingColumnId] = useState<string | null>(null);
    const [headerContextColumnId, setHeaderContextColumnId] = useState<string | null>(null);
    const [headerContextPoint, setHeaderContextPoint] = useState({x: 0, y: 0});
    const [jumpMode, setJumpMode] = useState<null | 'left' | 'right'>(null);
    const [jumpValue, setJumpValue] = useState('1');
    const [settingsReady, setSettingsReady] = useState(false);
    const [tableData, setTableData] = useState<TableRow[]>(() => data.map((row) => cloneTableRow(row)));
    const [editing, setEditing] = useState(false);
    const [draftChanges, setDraftChanges] = useState<TableDraftChanges>({});
    const [editingRowHeights, setEditingRowHeights] = useState<Record<number, number>>({});

    const onEventRef = useRef(onEvent);
    const externalDataRef = useRef(data);
    const visibleRowsRef = useRef<Array<{id: string; original: TableRow}>>([]);
    const selectedRowIdsRef = useRef<number[]>([]);
    const selectionAnchorRowIdRef = useRef<number | null>(null);
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
    const dragAutoScrollFrameRef = useRef<number | null>(null);
    const bodyStyleSnapshotRef = useRef<{userSelect: string; cursor: string} | null>(null);
    const headerContextToggleRef = useRef<HTMLDivElement>(null);
    const rowRefsRef = useRef<Record<number, HTMLTableRowElement | null>>({});
    const measuredRowHeightsRef = useRef<Record<number, number>>({});
    const previewSelectedRowIdsRef = useRef<number[]>([]);
    const editingRef = useRef(editing);
    const editModeTargetRef = useRef<EventTarget | null>(null);
    const editModeInitializedRef = useRef(false);

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

    const tableRowIds = useMemo(
        () => tableData.map((row, index) => (getRowId ? getRowId(row, index) : getDefaultRowId(row, index))),
        [getRowId, tableData],
    );
    const externalSelectedRowIds = useMemo(() => {
        if (selected === undefined) {
            return null;
        }

        return Array.from(new Set(selected));
    }, [selected]);
    const availableExternalSelectedRowIds = useMemo(() => {
        if (!externalSelectedRowIds) {
            return null;
        }

        const tableRowIdSet = new Set(tableRowIds);
        return externalSelectedRowIds.filter((rowId) => tableRowIdSet.has(rowId));
    }, [externalSelectedRowIds, tableRowIds]);
    const tableRowMap = useMemo(
        () => new Map(tableData.map((row, index) => [tableRowIds[index], row])),
        [tableData, tableRowIds],
    );
    const invalidRequiredCellKeys = useMemo(() => {
        const nextInvalidCellKeys = new Set<string>();

        if (!editing) {
            return nextInvalidCellKeys;
        }

        tableData.forEach((row, index) => {
            const rowId = tableRowIds[index];

            columns.forEach((column) => {
                const columnType = getColumnType(column);

                if ((columnType !== 'text' && columnType !== 'date') || !isCellRequired(row, column)) {
                    return;
                }

                const rowDraft = draftChanges[rowId];
                const value = rowDraft && Object.prototype.hasOwnProperty.call(rowDraft, column.key)
                    ? rowDraft[column.key]
                    : row[column.key];

                if (isEmptyCellValue(value)) {
                    nextInvalidCellKeys.add(`${rowId}:${column.key}`);
                }
            });
        });

        return nextInvalidCellKeys;
    }, [columns, draftChanges, editing, tableData, tableRowIds]);
    const hasInvalidRequiredCells = invalidRequiredCellKeys.size > 0;

    const table = useReactTable<TableRow>({
        data: tableData,
        columns: tableColumns,
        state: {
            sorting: tableSortingState,
            columnOrder: resolvedColumnOrder,
            columnSizing,
        },
        manualSorting: true,
        sortDescFirst: false,
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
                return String(getRowId(row, index));
            }

            return String(getDefaultRowId(row, index));
        },
    });

    const safeRows = rows > 0 ? rows : PAGE_SIZE_OPTIONS[0];
    const pageCount = Math.max(1, Math.ceil(total / safeRows));
    const pageIndex = Math.min(Math.max(page, 0), pageCount - 1);
    const currentPage = pageIndex + 1;
    const visibleRows = table.getRowModel().rows;
    const visibleRowIds = useMemo(() => visibleRows.map((row) => row.original.id), [visibleRows]);
    const selectedRowIdsSet = useMemo(() => new Set(selectedRowIds), [selectedRowIds]);
    const paginationItems = useMemo(() => buildPagination(currentPage, pageCount), [currentPage, pageCount]);
    const dragGhostHeader = draggingColumnId
        ? table.getFlatHeaders().find((header) => header.column.id === draggingColumnId) ?? null
        : null;

    useEffect(() => {
        onEventRef.current = onEvent;
    }, [onEvent]);

    useEffect(() => {
        editingRef.current = editing;

        if (!editModeInitializedRef.current) {
            editModeInitializedRef.current = true;
            return;
        }

        onEventRef.current({
            type: 'editMode',
            editing,
            target: editModeTargetRef.current,
        });
        editModeTargetRef.current = null;
    }, [editing]);

    useEffect(() => {
        if (editing || externalDataRef.current === data) {
            return;
        }

        externalDataRef.current = data;
        setTableData(data.map((row) => cloneTableRow(row)));
    }, [data, editing]);

    useEffect(() => {
        visibleRowsRef.current = visibleRows;
    }, [visibleRows]);

    useEffect(() => {
        selectedRowIdsRef.current = selectedRowIds;
        syncSelectedRowsPreview(selectedRowIds);
    }, [editing, selectedRowIds]);

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

            if (selected === undefined) {
                emitSelectedRowsByIds(nextSelectedRowIds, null);
            }
        }

        if (
            selectionAnchorRowIdRef.current
            && !visibleRowIdSet.has(selectionAnchorRowIdRef.current)
        ) {
            selectionAnchorRowIdRef.current = null;
        }
    }, [selected, visibleRowIds]);

    useEffect(() => {
        if (!availableExternalSelectedRowIds) {
            if (selected === undefined) {
                return;
            }

            if (selectedRowIdsRef.current.length === 0) {
                syncSelectedRowsPreview([]);
                return;
            }

            selectionAnchorRowIdRef.current = null;
            selectionStateRef.current.active = false;
            selectionStateRef.current.dirty = false;
            selectionStateRef.current.target = null;
            commitSelectedRows([]);
            return;
        }

        const isExternalSelectionTrimmed = externalSelectedRowIds !== null
            && !areArraysEqual(externalSelectedRowIds, availableExternalSelectedRowIds);

        if (areArraysEqual(selectedRowIdsRef.current, availableExternalSelectedRowIds)) {
            syncSelectedRowsPreview(availableExternalSelectedRowIds);

            if (isExternalSelectionTrimmed) {
                emitSelectedRowsByIds(availableExternalSelectedRowIds, null);
            }

            return;
        }

        selectionAnchorRowIdRef.current = availableExternalSelectedRowIds.at(-1) ?? null;
        selectionStateRef.current.active = false;
        selectionStateRef.current.dirty = false;
        selectionStateRef.current.target = null;
        commitSelectedRows(availableExternalSelectedRowIds);

        if (isExternalSelectionTrimmed) {
            emitSelectedRowsByIds(availableExternalSelectedRowIds, null);
        }
    }, [availableExternalSelectedRowIds, externalSelectedRowIds, selected, selectedRowIds]);

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

    const emitSelectedRowsByIds = (rowIds: number[], target: EventTarget | null) => {
        const nextSelectedRows = visibleRowsRef.current
            .filter((row) => rowIds.includes(row.original.id))
            .map((row) => row.original);

        onEventRef.current({
            type: 'selected',
            rowIds,
            rows: nextSelectedRows,
            target,
        });
    };

    const syncSelectedRowsPreview = (nextRowIds: number[]) => {
        const previousRowIdSet = new Set(previewSelectedRowIdsRef.current);
        const appliedRowIds = editingRef.current ? [] : nextRowIds;
        const nextRowIdSet = new Set(appliedRowIds);

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

        previewSelectedRowIdsRef.current = appliedRowIds;
    };

    const previewSelectedRows = (nextRowIds: number[]) => {
        const normalizedRowIds = Array.from(new Set(nextRowIds));

        if (areArraysEqual(selectedRowIdsRef.current, normalizedRowIds)) {
            syncSelectedRowsPreview(normalizedRowIds);
            return false;
        }

        selectedRowIdsRef.current = normalizedRowIds;
        syncSelectedRowsPreview(normalizedRowIds);
        return true;
    };

    const commitSelectedRows = (nextRowIds: number[]) => {
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
                ...interaction.baseSizing,
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
                .filter((row) => selectedRowIdsRef.current.includes(row.original.id))
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

    const stopColumnAutoScroll = () => {
        if (dragAutoScrollFrameRef.current === null) {
            return;
        }

        window.cancelAnimationFrame(dragAutoScrollFrameRef.current);
        dragAutoScrollFrameRef.current = null;
    };

    const stopColumnDragging = useEffectEvent((shouldCommit: boolean) => {
        const interaction = dragInteractionRef.current;
        const committedOrder = resolvedColumnOrderRef.current;
        const previewOrder = previewColumnOrderRef.current;

        if (interaction && interaction.ghostFrameId !== null) {
            window.cancelAnimationFrame(interaction.ghostFrameId);
        }

        stopColumnAutoScroll();
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

    const getColumnAutoScrollDelta = (clientX: number) => {
        const scrollElement = scrollRef.current;

        if (!scrollElement) {
            return 0;
        }

        const maxScrollLeft = scrollElement.scrollWidth - scrollElement.clientWidth;

        if (maxScrollLeft <= 0) {
            return 0;
        }

        const rect = scrollElement.getBoundingClientRect();
        const leftThreshold = rect.left + COLUMN_AUTO_SCROLL_EDGE;
        const rightThreshold = rect.right - COLUMN_AUTO_SCROLL_EDGE;

        if (clientX < leftThreshold && scrollElement.scrollLeft > 0) {
            const ratio = Math.min(1, (leftThreshold - clientX) / COLUMN_AUTO_SCROLL_EDGE);
            return -Math.max(1, Math.round(COLUMN_AUTO_SCROLL_MAX_STEP * ratio));
        }

        if (clientX > rightThreshold && scrollElement.scrollLeft < maxScrollLeft) {
            const ratio = Math.min(1, (clientX - rightThreshold) / COLUMN_AUTO_SCROLL_EDGE);
            return Math.max(1, Math.round(COLUMN_AUTO_SCROLL_MAX_STEP * ratio));
        }

        return 0;
    };

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
                ...nextInteraction.baseSizing,
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

    const stepColumnAutoScroll = useEffectEvent(() => {
        const interaction = dragInteractionRef.current;
        const scrollElement = scrollRef.current;

        if (!interaction || !interaction.started || !scrollElement) {
            dragAutoScrollFrameRef.current = null;
            return;
        }

        const delta = getColumnAutoScrollDelta(interaction.currentX);

        if (delta === 0) {
            dragAutoScrollFrameRef.current = null;
            return;
        }

        const maxScrollLeft = scrollElement.scrollWidth - scrollElement.clientWidth;
        const nextScrollLeft = Math.max(0, Math.min(maxScrollLeft, scrollElement.scrollLeft + delta));

        if (nextScrollLeft !== scrollElement.scrollLeft) {
            scrollElement.scrollLeft = nextScrollLeft;
            reorderDraggedColumn(interaction.currentX);
        }

        dragAutoScrollFrameRef.current = window.requestAnimationFrame(() => {
            stepColumnAutoScroll();
        });
    });

    const updateColumnAutoScroll = useEffectEvent((clientX: number) => {
        const interaction = dragInteractionRef.current;

        if (!interaction || !interaction.started) {
            stopColumnAutoScroll();
            return;
        }

        const delta = getColumnAutoScrollDelta(clientX);

        if (delta === 0) {
            stopColumnAutoScroll();
            return;
        }

        if (dragAutoScrollFrameRef.current !== null) {
            return;
        }

        dragAutoScrollFrameRef.current = window.requestAnimationFrame(() => {
            stepColumnAutoScroll();
        });
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
        updateColumnAutoScroll(event.clientX);
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

    const setSelectedRows = (nextRowIds: number[]) => {
        return previewSelectedRows(nextRowIds);
    };

    const getNextRowSelection = (
        rowId: number,
        event: {
            shiftKey?: boolean;
            ctrlKey?: boolean;
            metaKey?: boolean;
        } | null,
    ) => {
        if (event?.shiftKey && selectionAnchorRowIdRef.current !== null) {
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

    const beginSelection = (rowId: number, event: React.MouseEvent<HTMLTableRowElement>) => {
        if (editing || disabled || event.button !== 0 || isInteractiveTarget(event.target)) {
            return;
        }

        const selectionChanged = setSelectedRows(getNextRowSelection(rowId, event));

        event.preventDefault();
        selectionStateRef.current.active = true;
        selectionStateRef.current.target = event.target;
        selectionStateRef.current.dirty = selectionChanged;
    };

    const extendSelection = (rowId: number, target: EventTarget | null) => {
        if (editing || disabled || !selectionStateRef.current.active || selectionAnchorRowIdRef.current === null) {
            return;
        }

        const nextSelection = getRange(visibleRowIds, selectionAnchorRowIdRef.current, rowId);

        if (setSelectedRows(nextSelection)) {
            selectionStateRef.current.dirty = true;
            selectionStateRef.current.target = target;
        }
    };

    const emitSelectedRows = (target: EventTarget | null) => {
        emitSelectedRowsByIds(selectedRowIdsRef.current, target);
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
        if (editing || disabled || loading) {
            return;
        }

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
        if (editing || disabled || loading || event.button !== 0 || dragInteractionRef.current || resizeActiveRef.current) {
            return;
        }

        const cell = headerCellRefsRef.current[columnId];

        if (!cell) {
            return;
        }

        const column = columnMap.get(columnId);
        const baseSizing = columns.reduce<ColumnSizingState>((result, currentColumn) => {
            const currentCell = headerCellRefsRef.current[currentColumn.key];
            const fallbackWidth = liveColumnSizingRef.current[currentColumn.key]
                ?? committedColumnSizingRef.current[currentColumn.key]
                ?? getColumnDefaultWidth(currentColumn);

            result[currentColumn.key] = clampColumnWidth(
                currentCell?.getBoundingClientRect().width ?? fallbackWidth,
                currentColumn,
            );

            return result;
        }, {});
        const startWidth = baseSizing[columnId] ?? clampColumnWidth(cell.getBoundingClientRect().width, column);

        resizeInteractionRef.current = {
            columnId,
            startX: event.clientX,
            startWidth,
            currentWidth: startWidth,
            baseSizing,
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
        if (editing || disabled || loading || event.button !== 0 || resizeActiveRef.current || resizeInteractionRef.current) {
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

    const getSnapshotRowHeights = () => {
        const nextRowHeights = {...measuredRowHeightsRef.current};

        Object.entries(rowRefsRef.current).forEach(([rowId, rowElement]) => {
            if (!rowElement) {
                return;
            }

            nextRowHeights[Number(rowId)] = getMeasuredRowHeight(rowElement);
        });

        return nextRowHeights;
    };

    const updateDraftTextCell = (rowId: number, columnId: string, nextValue: string) => {
        if (!editing) {
            return;
        }

        const baseRow = tableRowMap.get(rowId);
        const baseValue = getCellTextValue(baseRow?.[columnId]);

        setDraftChanges((previousDraftChanges) => {
            const nextDraftChanges = {...previousDraftChanges};
            const previousRowDraft = previousDraftChanges[rowId];
            const nextRowDraft = previousRowDraft ? {...previousRowDraft} : {};

            if (nextValue === baseValue) {
                delete nextRowDraft[columnId];
            } else {
                nextRowDraft[columnId] = nextValue;
            }

            if (Object.keys(nextRowDraft).length === 0) {
                delete nextDraftChanges[rowId];
            } else {
                nextDraftChanges[rowId] = nextRowDraft;
            }

            return nextDraftChanges;
        });
    };

    const startEditing = (target: EventTarget | null) => {
        if (editing || loading || disabled || tableData.length === 0) {
            return;
        }

        setHeaderContextColumnId(null);
        setJumpMode(null);
        selectionStateRef.current.active = false;
        selectionStateRef.current.dirty = false;
        selectionStateRef.current.target = null;
        syncSelectedRowsPreview([]);
        setEditingRowHeights(getSnapshotRowHeights());
        setDraftChanges({});
        editModeTargetRef.current = target;
        setEditing(true);
    };

    const cancelEditing = (target: EventTarget | null) => {
        selectionStateRef.current.active = false;
        selectionStateRef.current.dirty = false;
        selectionStateRef.current.target = null;
        setEditingRowHeights({});
        setDraftChanges({});
        editModeTargetRef.current = target;
        setEditing(false);
    };

    const saveEditing = (target: EventTarget | null) => {
        if (!editing || hasInvalidRequiredCells) {
            return;
        }

        const currentDraftChanges = draftChanges;
        const nextRows = tableData.map((row, index) => mergeRowDraftChanges(row, currentDraftChanges[tableRowIds[index]]));

        selectionStateRef.current.active = false;
        selectionStateRef.current.dirty = false;
        selectionStateRef.current.target = null;
        setTableData(nextRows);
        setEditingRowHeights({});
        setDraftChanges({});
        editModeTargetRef.current = target;
        setEditing(false);
        onEventRef.current({
            type: 'editSave',
            changes: currentDraftChanges,
            target,
        });
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
                        className={classNames(
                            styles.table,
                            editing && styles['table--editing'],
                        )}
                        style={{width: `var(${TABLE_TOTAL_WIDTH_CSS_VAR}, ${table.getTotalSize()}px)`}}
                    >
                        <TableHeader
                            disabled={disabled || editing}
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
                            editing={editing}
                            scrollRef={scrollRef}
                            visibleRows={visibleRows}
                            columnMap={columnMap}
                            draftChanges={draftChanges}
                            invalidRequiredCellKeys={invalidRequiredCellKeys}
                            draggingColumnId={draggingColumnId}
                            resizingColumnId={resizingColumnId}
                            selectedRowIdsSet={selectedRowIdsSet}
                            rowRefsRef={rowRefsRef}
                            measuredRowHeightsRef={measuredRowHeightsRef}
                            rowHeights={editingRowHeights}
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
                            onDraftTextChange={updateDraftTextCell}
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
                            title={emptyState.title}
                            icon={emptyState.icon}
                        >
                            <Text>
                                {emptyState.description}
                            </Text>
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

            {!editing && headerContextColumnId && (
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

            {!hideFooter && (
                <TableFooter
                    disabled={disabled}
                    loading={loading}
                    editing={editing}
                    total={total}
                    saveDisabled={hasInvalidRequiredCells}
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
                    onStartEdit={startEditing}
                    onCancelEdit={cancelEditing}
                    onSaveEdit={saveEditing}
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
            )}
        </>
    );
};

export default Table;
