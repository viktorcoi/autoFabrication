import {flexRender} from '@tanstack/react-table';
import {
    Icon16SortArrowDown,
    Icon16SortArrowUp,
    Icon16SortOutline,
} from '@vkontakte/icons';
import {Text, classNames} from '@vkontakte/vkui';
import {getColumnWidthCssVarName, renderContent} from '../helpers';
import styles from './TableHeader.module.scss';
import type {TableHeaderProps} from './types';

const TableHeader = (props: TableHeaderProps) => {
    const {
        disabled,
        loading,
        headerGroups,
        draggingColumnId,
        resizingColumnId,
        headerCellRefsRef,
        onOpenContextMenu,
        beginColumnInteraction,
        beginColumnResize,
    } = props;

    const headerDisabled = loading || disabled;

    return (
        <thead>
            {headerGroups.map((headerGroup) => (
                <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => {
                        const columnId = header.column.id;
                        const isDragging = draggingColumnId === columnId;
                        const isResizing = resizingColumnId === columnId;

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
                                    if (headerDisabled) {
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
                                        isDragging && styles['headerInner--dragging'],
                                        headerDisabled && 'disabled',
                                    )}
                                    onMouseDown={(event) => beginColumnInteraction(columnId, event)}
                                >
                                    <Text
                                        weight={'1'}
                                        className={styles.text}
                                    >
                                        {renderContent(
                                            flexRender(header.column.columnDef.header, header.getContext()),
                                            styles.headerTitle,
                                        )}
                                    </Text>
                                    {header.column.getIsSorted() === 'asc' && (
                                        <Icon16SortArrowUp className={styles.sort} fill="var(--vkui--color_icon_tertiary)"/>
                                    )}
                                    {header.column.getIsSorted() === 'desc' && (
                                        <Icon16SortArrowDown className={styles.sort} fill="var(--vkui--color_icon_tertiary)"/>
                                    )}
                                    {!header.column.getIsSorted() && (
                                        <Icon16SortOutline className={styles.sort} fill="var(--vkui--color_icon_tertiary)"/>
                                    )}
                                </div>

                                {header.column.getCanResize() && (
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
