import React from 'react';
import {flexRender} from '@tanstack/react-table';
import {useVirtualizer} from '@tanstack/react-virtual';
import {Icon16DownloadOutline} from '@vkontakte/icons';
import {Button, Checkbox, Input, Text, Tooltip, classNames} from '@vkontakte/vkui';
import {
    DEFAULT_ROW_HEIGHT,
    ROW_VIRTUAL_OVERSCAN,
    getBooleanCellValue,
    getCellTextValue,
    getColumnType,
    getColumnWidthCssVarName,
    getDraftValue,
    isCellConst,
    isInteractiveTarget,
    renderContent,
} from '../helpers';
import styles from './TableBody.module.scss';
import type {TableBodyProps} from './types';

const TableBody = React.memo((props: TableBodyProps) => {
    const {
        disabled,
        loading,
        editing,
        scrollRef,
        visibleRows,
        columnMap,
        draftChanges,
        invalidRequiredCellKeys,
        draggingColumnId,
        resizingColumnId,
        selectedRowIdsSet,
        rowRefsRef,
        measuredRowHeightsRef,
        rowHeights,
        previewSelectedRowIdsRef,
        selectionStateRef,
        onEventRef,
        beginSelection,
        extendSelection,
        getNextRowSelection,
        setSelectedRows,
        emitSelectedRows,
        emitCellClick,
        emitCellDoubleClick,
        emitInteractiveClick,
        emitBooleanChange,
        onDraftTextChange,
    } = props;

    const rowVirtualizer = useVirtualizer<HTMLDivElement, HTMLTableRowElement>({
        count: visibleRows.length,
        getItemKey: (index) => visibleRows[index]?.id ?? index,
        getScrollElement: () => scrollRef.current,
        estimateSize: () => DEFAULT_ROW_HEIGHT,
        measureElement:
            typeof window !== 'undefined' && !window.navigator.userAgent.includes('Firefox')
                ? (element) => element?.getBoundingClientRect().height ?? DEFAULT_ROW_HEIGHT
                : undefined,
        overscan: ROW_VIRTUAL_OVERSCAN,
        useFlushSync: false,
    });

    const virtualRows = rowVirtualizer.getVirtualItems();
    const paddingTop = virtualRows[0]?.start ?? 0;
    const paddingBottom = virtualRows.length > 0
        ? rowVirtualizer.getTotalSize() - virtualRows[virtualRows.length - 1].end
        : 0;
    const visibleColumnCount = visibleRows[0]?.getVisibleCells().length ?? columnMap.size;
    const rowActionsDisabled = loading || Boolean(disabled) || editing;
    const controlDisabled = loading || Boolean(disabled) || editing;

    return (
        <tbody>
            {(visibleRows.length !== 0 && !loading) && (
                <>
                    {paddingTop > 0 && (
                        <tr className={styles.bodySpacer}>
                            <td
                                className={styles.bodySpacerCell}
                                colSpan={visibleColumnCount}
                                style={{height: `${paddingTop}px`}}
                            />
                        </tr>
                    )}

                    {virtualRows.map((virtualRow) => {
                        const row = visibleRows[virtualRow.index];

                        if (!row) {
                            return null;
                        }

                        const isSelectedRow = !editing && (
                            selectionStateRef.current.active
                            ? previewSelectedRowIdsRef.current.includes(row.id)
                            : selectedRowIdsSet.has(row.id)
                        );
                        const rowHeight = editing ? rowHeights[row.id] : undefined;

                        return (
                            <tr
                                key={row.id}
                                data-index={virtualRow.index}
                                ref={(element) => {
                                    rowRefsRef.current[row.id] = element;

                                    if (element) {
                                        if (!editing) {
                                            measuredRowHeightsRef.current[row.id] = Math.max(
                                                DEFAULT_ROW_HEIGHT,
                                                Math.ceil(element.getBoundingClientRect().height),
                                            );
                                        }

                                        element.classList.toggle(
                                            styles['bodyRow--selected'],
                                            !editing && previewSelectedRowIdsRef.current.includes(row.id),
                                        );
                                        rowVirtualizer.measureElement(element);
                                    }
                                }}
                                style={rowHeight ? {height: `${rowHeight}px`} : undefined}
                                className={classNames(
                                    styles.bodyRow,
                                    virtualRow.index % 2 === 0 && styles['bodyRow--odd'],
                                    isSelectedRow && styles['bodyRow--selected'],
                                    editing && styles['bodyRow--editing'],
                                    disabled && !editing && 'disabled',
                                )}
                                onMouseDown={(event) => {
                                    if (rowActionsDisabled) {
                                        return;
                                    }

                                    beginSelection(row.id, event);
                                }}
                                onMouseEnter={(event) => {
                                    if (rowActionsDisabled) {
                                        return;
                                    }

                                    extendSelection(row.id, event.target);
                                }}
                                onClick={(event) => {
                                    if (rowActionsDisabled || isInteractiveTarget(event.target)) {
                                        return;
                                    }

                                    onEventRef.current({
                                        type: 'rowClick',
                                        row: row.original,
                                        target: event.target,
                                    });
                                }}
                                onDoubleClick={(event) => {
                                    if (rowActionsDisabled || isInteractiveTarget(event.target)) {
                                        return;
                                    }

                                    onEventRef.current({
                                        type: 'rowDoubleClick',
                                        row: row.original,
                                        target: event.target,
                                    });
                                }}
                            >
                                {row.getVisibleCells().map((cell) => {
                                    const columnId = cell.column.id;
                                    const columnConfig = columnMap.get(columnId);
                                    const columnType = getColumnType(columnConfig);
                                    const cellValue = cell.getValue();
                                    const renderedCell = flexRender(cell.column.columnDef.cell, cell.getContext());
                                    const draftValue = getDraftValue(draftChanges, row.id, columnId, cellValue);
                                    const cellTextValue = getCellTextValue(draftValue);
                                    const checkboxValue = getBooleanCellValue(cellValue);
                                    const isDragging = draggingColumnId === columnId;
                                    const isResizing = resizingColumnId === columnId;
                                    const isConstCell = isCellConst(row.original, columnConfig);
                                    const isInvalidRequiredCell = editing
                                        && invalidRequiredCellKeys.has(`${row.id}:${columnId}`);
                                    let cellContent: React.ReactNode;

                                    if (columnType === 'button') {
                                        cellContent = (
                                            <Button
                                                className={styles.button}
                                                size="s"
                                                mode="secondary"
                                                data-table-ignore-hover={true}
                                                disabled={controlDisabled}
                                                onMouseDown={(event) => event.stopPropagation()}
                                                onClick={(event) => {
                                                    event.stopPropagation();

                                                    if (controlDisabled) {
                                                        return;
                                                    }

                                                    emitInteractiveClick('button', {
                                                        row: row.original,
                                                        column: columnId,
                                                        value: cellValue,
                                                        event,
                                                        target: event.target,
                                                    });
                                                }}
                                                onDoubleClick={(event) => {
                                                    event.stopPropagation();

                                                    if (controlDisabled) {
                                                        return;
                                                    }

                                                    emitInteractiveClick('button', {
                                                        row: row.original,
                                                        column: columnId,
                                                        value: cellValue,
                                                        event,
                                                        target: event.target,
                                                    });
                                                }}
                                            >
                                                {cellTextValue}
                                            </Button>
                                        );
                                    } else if (columnType === 'download') {
                                        cellContent = (
                                            <Tooltip
                                                description={cellTextValue}
                                                usePortal={true}
                                                placement="top"
                                            >
                                                <Button
                                                    data-table-ignore-hover={true}
                                                    size="s"
                                                    mode="tertiary"
                                                    className={styles.button}
                                                    label={cellTextValue}
                                                    disabled={controlDisabled}
                                                    onMouseDown={(event) => event.stopPropagation()}
                                                    onClick={(event) => {
                                                        event.stopPropagation();

                                                        if (controlDisabled) {
                                                            return;
                                                        }

                                                        emitInteractiveClick('download', {
                                                            row: row.original,
                                                            column: columnId,
                                                            value: cellValue,
                                                            event,
                                                            target: event.target,
                                                        });
                                                    }}
                                                    onDoubleClick={(event) => {
                                                        event.stopPropagation();

                                                        if (controlDisabled) {
                                                            return;
                                                        }

                                                        emitInteractiveClick('download', {
                                                            row: row.original,
                                                            column: columnId,
                                                            value: cellValue,
                                                            event,
                                                            target: event.target,
                                                        });
                                                    }}
                                                    after={<Icon16DownloadOutline />}
                                                />
                                            </Tooltip>
                                        );
                                    } else if (columnType === 'boolean') {
                                        cellContent = (
                                            <span
                                                data-table-ignore-row={true}
                                                data-table-ignore-hover={true}
                                                className={styles.checkboxWrap}
                                                onMouseDown={(event) => event.stopPropagation()}
                                                onClick={(event) => event.stopPropagation()}
                                                onDoubleClick={(event) => event.stopPropagation()}
                                            >
                                                <Checkbox
                                                    className={styles.checkbox}
                                                    key={`${row.id}:${columnId}:${checkboxValue ? '1' : '0'}`}
                                                    defaultChecked={checkboxValue}
                                                    disabled={controlDisabled}
                                                    onMouseDown={(event) => event.stopPropagation()}
                                                    onClick={(event) => event.stopPropagation()}
                                                    onDoubleClick={(event) => event.stopPropagation()}
                                                    onChange={(event) => {
                                                        event.stopPropagation();

                                                        if (controlDisabled) {
                                                            return;
                                                        }

                                                        emitBooleanChange({
                                                            row: row.original,
                                                            column: columnId,
                                                            value: cellValue,
                                                            event,
                                                            target: event.target,
                                                            nextValue: event.target.checked,
                                                        });
                                                    }}
                                                />
                                            </span>
                                        );
                                    } else if (editing) {
                                        cellContent = (
                                            <Input
                                                value={cellTextValue}
                                                className={styles.cellInput}
                                                mode={'plain'}
                                                disabled={isConstCell || loading || Boolean(disabled)}
                                                onChange={(event) => {
                                                    onDraftTextChange(row.id, columnId, event.target.value);
                                                }}
                                                onMouseDown={(event) => event.stopPropagation()}
                                                onClick={(event) => event.stopPropagation()}
                                                onDoubleClick={(event) => event.stopPropagation()}
                                            />
                                        );
                                    } else {
                                        cellContent = (
                                            <Text>
                                                {renderContent(renderedCell, styles.cellText)}
                                            </Text>
                                        );
                                    }

                                    return (
                                        <td
                                            key={cell.id}
                                            data-column-id={columnId}
                                            data-cell-key={`c:${cell.id}`}
                                            className={classNames(
                                                styles.bodyCell,
                                                isDragging && styles.bodyCellActiveDrag,
                                                isResizing && styles.bodyCellResizing,
                                                editing && columnType === 'text' && styles['bodyCell--editing'],
                                                isInvalidRequiredCell && styles['bodyCell--invalid'],
                                            )}
                                            style={{
                                                width: `var(${getColumnWidthCssVarName(columnId)}, ${cell.column.getSize()}px)`,
                                            }}
                                            onClick={(event) => {
                                                if (rowActionsDisabled) {
                                                    return;
                                                }

                                                if (isInteractiveTarget(event.target) && event.target !== event.currentTarget) {
                                                    return;
                                                }

                                                event.stopPropagation();

                                                emitCellClick({
                                                    row: row.original,
                                                    column: columnId,
                                                    value: cellValue,
                                                    event,
                                                    target: event.target,
                                                });
                                            }}
                                            onDoubleClick={(event) => {
                                                if (rowActionsDisabled) {
                                                    return;
                                                }

                                                if (isInteractiveTarget(event.target) && event.target !== event.currentTarget) {
                                                    return;
                                                }

                                                event.stopPropagation();

                                                emitCellDoubleClick({
                                                    row: row.original,
                                                    column: columnId,
                                                    value: cellValue,
                                                    event,
                                                    target: event.target,
                                                });
                                            }}
                                            onContextMenu={(event) => {
                                                event.preventDefault();

                                                if (rowActionsDisabled) {
                                                    return;
                                                }

                                                const nextSelection = getNextRowSelection(row.id, event);
                                                const selectionChanged = setSelectedRows(nextSelection);
                                                selectionStateRef.current.active = false;
                                                selectionStateRef.current.dirty = false;
                                                selectionStateRef.current.target = null;

                                                if (selectionChanged) {
                                                    emitSelectedRows(event.target);
                                                }

                                                onEventRef.current({
                                                    type: 'contextMenu',
                                                    row: row.original,
                                                    column: columnId,
                                                    value: cellValue,
                                                    target: event.target,
                                                });
                                            }}
                                        >
                                            {columnType === 'text' ? (
                                                cellContent
                                            ) : (
                                                <div
                                                    className={classNames(
                                                        styles.cellControl,
                                                        columnType === 'boolean' && styles.cellControlBoolean,
                                                    )}
                                                >
                                                    {cellContent}
                                                </div>
                                            )}
                                        </td>
                                    );
                                })}
                            </tr>
                        );
                    })}

                    {paddingBottom > 0 && (
                        <tr className={styles.bodySpacer}>
                            <td
                                className={styles.bodySpacerCell}
                                colSpan={visibleColumnCount}
                                style={{height: `${paddingBottom}px`}}
                            />
                        </tr>
                    )}
                </>
            )}
        </tbody>
    );
});

TableBody.displayName = 'TableBody';

export default TableBody;
