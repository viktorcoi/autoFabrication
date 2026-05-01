import {flexRender} from '@tanstack/react-table';
import {
    Icon16SortArrowDown,
    Icon16SortArrowUp,
    Icon16SortOutline,
} from '@vkontakte/icons';
import {classNames} from '@vkontakte/vkui';
import {getColumnWidthCssVarName, renderContent} from '../helpers';
import styles from './TableHeader.module.scss';
import type {TableHeaderProps} from './types';

const TableHeader = (props: TableHeaderProps) => {
    const {
        disabled,
        editing,
        loading,
        headerGroups,
        columnMap,
        draggingColumnId,
        resizingColumnId,
        headerCellRefsRef,
        onOpenContextMenu,
        beginColumnInteraction,
        beginColumnResize,
    } = props;

    const headerDisabled = loading || disabled;

    return (
        <thead className={styles.thead}>
            {headerGroups.map((headerGroup) => (
                <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => {
                        const columnId = header.column.id;
                        const columnConfig = columnMap.get(columnId);
                        const isDragging = draggingColumnId === columnId;
                        const isResizing = resizingColumnId === columnId;
                        const canDrag = columnConfig?.dragging !== false;
                        const canSort = header.column.getCanSort();
                        const canResize = header.column.getCanResize();
                        const hasPrimaryInteraction = canDrag || canSort;

                        return (
                            <th
                                key={header.id}
                                ref={(element) => {
                                    headerCellRefsRef.current[columnId] = element;
                                }}
                                data-column-id={columnId}
                                data-cell-key={`h:${header.id}`}
                                className={classNames(
                                    styles.headerCell,
                                    isDragging && styles.headerCellActiveDrag,
                                    isResizing && styles.headerCellResizing,
                                    headerDisabled && styles['headerCell--disabled'],
                                )}
                                style={{width: `var(${getColumnWidthCssVarName(columnId)}, ${header.getSize()}px)`}}
                                onContextMenu={(event) => {
                                    if (headerDisabled || editing) {
                                        return;
                                    }

                                    event.preventDefault();
                                    onOpenContextMenu(columnId, {
                                        x: event.clientX,
                                        y: event.clientY,
                                    });
                                }}
                            >
                                <div
                                    className={classNames(
                                        styles.headerInner,
                                        (headerDisabled || editing || !hasPrimaryInteraction) && styles['headerInner--static'],
                                        !headerDisabled && !editing && canDrag && !canSort && styles['headerInner--draggable'],
                                        isDragging && styles['headerInner--dragging'],
                                        (headerDisabled || editing) && 'disabled',
                                    )}
                                    onMouseDown={
                                        headerDisabled || editing || !hasPrimaryInteraction
                                            ? undefined
                                            : (event) => beginColumnInteraction(columnId, event)
                                    }
                                >
                                    {renderContent(
                                        flexRender(header.column.columnDef.header, header.getContext()),
                                        styles.text,
                                        true
                                    )}
                                    {canSort && header.column.getIsSorted() === 'asc' && (
                                        <Icon16SortArrowUp className={styles.sort} fill="var(--vkui--color_icon_tertiary)"/>
                                    )}
                                    {canSort && header.column.getIsSorted() === 'desc' && (
                                        <Icon16SortArrowDown className={styles.sort} fill="var(--vkui--color_icon_tertiary)"/>
                                    )}
                                    {canSort && !header.column.getIsSorted() && (
                                        <Icon16SortOutline className={styles.sort} fill="var(--vkui--color_icon_tertiary)"/>
                                    )}
                                </div>

                                {canResize && (
                                    <div
                                        data-table-resize-handle={true}
                                        className={styles.resizeHandle}
                                        onMouseDown={(event) => beginColumnResize(columnId, event)}
                                    />
                                )}
                            </th>
                        );
                    })}
                </tr>
            ))}
        </thead>
    );
};

export default TableHeader;
