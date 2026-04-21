import {
    Icon20WarningTriangleOutline,
    Icon24Cancel,
    Icon24ChevronCompactLeft,
    Icon24ChevronCompactRight,
    Icon24Done,
} from '@vkontakte/icons';
import {Button, Input, Select, classNames} from '@vkontakte/vkui';
import {PAGE_SIZE_OPTIONS} from '../helpers';
import styles from './TableFooter.module.scss';
import type {TableFooterProps} from './types';

const TableFooter = (props: TableFooterProps) => {
    const {
        disabled,
        loading,
        safeRows,
        pageIndex,
        pageCount,
        currentPage,
        jumpMode,
        jumpValue,
        paginationItems,
        setJumpMode,
        setJumpValue,
        submitJump,
        onRowsChange,
        onPageChange,
    } = props;

    return (
        <div className={classNames('island', styles.footer)}>
            <div className={styles.edit}>
                <Select
                    className={classNames(
                        (loading || disabled) && 'disabled',
                        styles.footer__select,
                    )}
                    value={String(safeRows)}
                    disabled={loading || disabled}
                    options={PAGE_SIZE_OPTIONS.map((size) => ({
                        label: String(size),
                        value: String(size),
                    }))}
                    onChange={(event) => {
                        const nextRows = Number(event.target.value);

                        if (nextRows === safeRows) {
                            return;
                        }

                        onRowsChange(nextRows, event.target);
                    }}
                />
                <Button
                    mode={'secondary'}
                    before={(
                        <Icon20WarningTriangleOutline
                            width={16}
                            height={16}
                            fill={'var(--vkui--color_icon_warning)'}
                        />
                    )}
                >
                    Режим редактирования
                </Button>
            </div>
            <div className={styles.pagination}>
                <Button
                    size="m"
                    mode="secondary"
                    before={<Icon24ChevronCompactLeft />}
                    disabled={loading || disabled || pageIndex === 0}
                    onClick={(event) => onPageChange(pageIndex - 1, event.target)}
                />

                <div className={styles.pagination__pages}>
                    {jumpMode ? (
                        <div className={styles.pagination__jump}>
                            <Input
                                type="number"
                                min={1}
                                max={pageCount}
                                value={jumpValue}
                                className={styles.pagination__input}
                                onChange={(event) => setJumpValue(event.target.value)}
                                onKeyDown={(event) => {
                                    if (event.key === 'Enter') {
                                        submitJump();
                                    }

                                    if (event.key === 'Escape') {
                                        setJumpMode(null);
                                    }
                                }}
                                onWheel={(event) => {
                                    const delta = event.deltaY > 0 ? 1 : -1;
                                    const nextValue = Math.min(
                                        pageCount,
                                        Math.max(1, Number(jumpValue || currentPage) - delta),
                                    );
                                    setJumpValue(String(nextValue));
                                }}
                            />
                            <Button
                                size="m"
                                mode="tertiary"
                                before={<Icon24Done />}
                                appearance="positive"
                                onClick={submitJump}
                            />
                            <Button
                                size="m"
                                mode="tertiary"
                                before={<Icon24Cancel />}
                                appearance="negative"
                                onClick={() => setJumpMode(null)}
                            />
                        </div>
                    ) : (
                        paginationItems.map((item) => {
                            if (typeof item === 'number') {
                                const isActive = item === currentPage;

                                return (
                                    <Button
                                        key={item}
                                        size="m"
                                        mode={isActive ? 'primary' : 'tertiary'}
                                        className={classNames(
                                            styles.pagination__page,
                                            isActive && styles['pagination__page--active'],
                                        )}
                                        after={item}
                                        disabled={loading || disabled || isActive}
                                        onClick={(event) => onPageChange(item - 1, event.target)}
                                    />
                                );
                            }

                            return (
                                <Button
                                    key={item}
                                    size="m"
                                    mode="tertiary"
                                    disabled={loading || disabled}
                                    onClick={() => setJumpMode(item === 'ellipsis-left' ? 'left' : 'right')}
                                    after="..."
                                />
                            );
                        })
                    )}
                </div>

                <Button
                    size="m"
                    mode="secondary"
                    before={<Icon24ChevronCompactRight />}
                    disabled={loading || disabled || pageIndex + 1 >= pageCount}
                    onClick={(event) => onPageChange(pageIndex + 1, event.target)}
                />
            </div>
        </div>
    );
};

export default TableFooter;
