import React, {useState} from 'react';
import {flexRender} from '@tanstack/react-table';
import {useVirtualizer} from '@tanstack/react-virtual';
import {
    Icon16CancelCircle,
    Icon16DownloadOutline,
    Icon24View,
    Icon40DoneCircle
} from '@vkontakte/icons';
import {Avatar, Button, Checkbox, DateInput, Input, Text, Tooltip, classNames} from '@vkontakte/vkui';
import {
    formatDateCellValue,
    getAvatarCellSrc,
    DEFAULT_ROW_HEIGHT,
    ROW_VIRTUAL_OVERSCAN,
    getBooleanCellValue,
    getCellTextValue,
    getColumnType,
    getDateCellValue,
    getColumnWidthCssVarName,
    getDraftValue,
    getMeasuredRowHeight,
    isCellConst,
    isInteractiveTarget,
    renderContent,
} from '../helpers';
import styles from './TableBody.module.scss';
import type {TableBodyProps} from './types';
import ImagesProvider from "@/components/ImagesProvider/ImagesProvider";
import {PhotoView} from "react-photo-view";

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

    const [openAvatar, setOpenAvatar] = useState(false);

    const virtualRows = rowVirtualizer.getVirtualItems();
    const paddingTop = virtualRows[0]?.start ?? 0;
    const paddingBottom = virtualRows.length > 0
        ? rowVirtualizer.getTotalSize() - virtualRows[virtualRows.length - 1].end
        : 0;
    const visibleColumnCount = visibleRows[0]?.getVisibleCells().length ?? columnMap.size;
    const rowActionsDisabled = loading || Boolean(disabled) || editing || openAvatar;
    const controlDisabled = loading || Boolean(disabled) || editing || openAvatar;

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

                        const rowId = row.original.id;

                        const isSelectedRow = !editing && (
                            selectionStateRef.current.active
                            ? previewSelectedRowIdsRef.current.includes(rowId)
                            : selectedRowIdsSet.has(rowId)
                        );
                        const rowHeight = editing ? rowHeights[rowId] : undefined;

                        return (
                            <tr
                                key={rowId}
                                data-index={virtualRow.index}
                                ref={(element) => {
                                    rowRefsRef.current[rowId] = element;

                                    if (element) {
                                        if (!editing) {
                                            measuredRowHeightsRef.current[rowId] = getMeasuredRowHeight(element);
                                        }

                                        element.classList.toggle(
                                            styles['bodyRow--selected'],
                                            !editing && previewSelectedRowIdsRef.current.includes(rowId),
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

                                    beginSelection(rowId, event);
                                }}
                                onMouseEnter={(event) => {
                                    if (rowActionsDisabled) {
                                        return;
                                    }

                                    extendSelection(rowId, event.target);
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
                                    const draftValue = getDraftValue(draftChanges, rowId, columnId, cellValue);
                                    const cellTextValue = getCellTextValue(draftValue);
                                    const avatarSrc = getAvatarCellSrc(cellValue);
                                    const checkboxValue = getBooleanCellValue(cellValue);
                                    const dateValue = getDateCellValue(draftValue);
                                    const statusValue = typeof draftValue === 'string'
                                        ? draftValue.trim().toLowerCase()
                                        : null;
                                    const isDragging = draggingColumnId === columnId;
                                    const isResizing = resizingColumnId === columnId;
                                    const isConstCell = isCellConst(row.original, columnConfig);
                                    const isInvalidRequiredCell = editing
                                        && invalidRequiredCellKeys.has(`${rowId}:${columnId}`);
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
                                        cellContent = !cellTextValue ? null : (
                                            <Tooltip
                                                description={'Скачать файлы'}
                                                usePortal={true}
                                                placement="top"
                                                disableTriggerOnFocus={true}
                                            >
                                                <Button
                                                    data-table-ignore-hover={true}
                                                    size="s"
                                                    mode="tertiary"
                                                    className={styles.button}
                                                    label={'Скачать файлы'}
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
                                                    key={`${rowId}:${columnId}:${checkboxValue ? '1' : '0'}`}
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
                                    } else if (columnType === 'avatar') {
                                        cellContent = avatarSrc ? (
                                            <span
                                                className={styles.avatar}
                                                data-table-ignore-row={true}
                                                data-table-ignore-hover={true}
                                                onMouseDown={(event) => event.stopPropagation()}
                                                onClick={(event) => event.stopPropagation()}
                                                onDoubleClick={(event) => event.stopPropagation()}
                                            >
                                                {editing ? (
                                                    <Avatar
                                                        size={44}
                                                        src={avatarSrc}
                                                        className={'disabled'}
                                                    />
                                                ) : (
                                                    <ImagesProvider onVisibleChange={setOpenAvatar}>
                                                        <PhotoView src={avatarSrc}>
                                                            <Avatar
                                                                size={44}
                                                                src={avatarSrc}
                                                            >
                                                                <Avatar.Overlay theme="dark" visibility="on-hover">
                                                                    <Icon24View />
                                                                </Avatar.Overlay>
                                                            </Avatar>
                                                        </PhotoView>
                                                    </ImagesProvider>
                                                )}
                                            </span>
                                        ) : null;
                                    } else if (columnType === 'date' && editing) {
                                        cellContent = (
                                            <DateInput
                                                mode={'plain'}
                                                value={dateValue ?? undefined}
                                                className={styles.cellInput}
                                                disabled={isConstCell || loading || Boolean(disabled)}
                                                closeOnChange={true}
                                                onChange={(nextValue) => {
                                                    onDraftTextChange(
                                                        rowId,
                                                        columnId,
                                                        nextValue ? nextValue.toISOString() : '',
                                                    );
                                                }}
                                                onMouseDown={(event) => event.stopPropagation()}
                                                onClick={(event) => event.stopPropagation()}
                                                onDoubleClick={(event) => event.stopPropagation()}
                                            />
                                        );
                                    } else if (columnType === 'date') {
                                        cellContent = (
                                            <Text className={styles.text}>
                                                {formatDateCellValue(cellValue)}
                                            </Text>
                                        );
                                    } else if (columnType === 'status') {
                                        if (statusValue === 'success') {
                                            cellContent = (
                                                <Icon40DoneCircle
                                                    width={24}
                                                    height={24}
                                                    fill={'var(--vkui--color_icon_positive)'}
                                                />
                                            );
                                        } else if (statusValue === 'error') {
                                            cellContent = (
                                                <Icon16CancelCircle
                                                    width={24}
                                                    height={24}
                                                    fill={'var(--vkui--color_icon_negative)'}
                                                />
                                            );
                                        } else {
                                            cellContent = (
                                                <Text className={styles.text}>
                                                    {cellTextValue}
                                                </Text>
                                            );
                                        }
                                    } else if (editing) {
                                        cellContent = (
                                            <Input
                                                value={cellTextValue}
                                                className={styles.cellInput}
                                                mode={'plain'}
                                                disabled={isConstCell || loading || Boolean(disabled)}
                                                onChange={(event) => {
                                                    onDraftTextChange(rowId, columnId, event.target.value);
                                                }}
                                                onMouseDown={(event) => event.stopPropagation()}
                                                onClick={(event) => event.stopPropagation()}
                                                onDoubleClick={(event) => event.stopPropagation()}
                                            />
                                        );
                                    } else {
                                        cellContent = (
                                            <Text className={styles.text}>
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
                                                editing && (columnType === 'text' || columnType === 'date') && styles['bodyCell--editing'],
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

                                                const nextSelection = getNextRowSelection(rowId, event);
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
                                            {(columnType === 'text' || columnType === 'date') ? (
                                                cellContent
                                            ) : (
                                                <div
                                                    className={classNames(
                                                        styles.cellControl,
                                                        columnType === 'boolean' && styles.cellControlBoolean,
                                                        columnType === 'status' && styles.cellControlStatus,
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
