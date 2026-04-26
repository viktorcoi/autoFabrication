import {useMemo, useState} from "react";
import {ModalPage, ModalPageProps, Select} from "@vkontakte/vkui";
import Table from "@/components/Table/Table";
import type {TableEvent, TableSorting} from "@/components/Table/types";
import styles from "./ModalShowErrors.module.scss";
import {useShowErrors} from "@/store/showErrors/showErrors";
import {compareValues} from "@/components/modals/ModalShowErrors/helpers";
import {ShowErrorType} from "@/store/showErrors/types";
import {tableColumns} from "@/shared/tableColumns";

const ModalShowErrors = (props: ModalPageProps) => {

    const [filter, setFilter] = useState('all');
    const [sort, setSort] = useState<TableSorting>(null);
    const {
        data,
        onClose,
        onClosed
    } = useShowErrors(s => s);

    const handleTableEvent = (e: TableEvent) => {
        if (e.type === 'sortChange') {
            setSort(e.sorting);
        }
    };

    const filteredAndSortedData = useMemo(() => {
        const nextData = data.filter(({status}) => filter === 'all' || status === filter);

        if (!sort) {
            return nextData;
        }

        return [...nextData].sort((leftRow, rightRow) => {
            const leftValue = leftRow[sort.id as keyof ShowErrorType];
            const rightValue = rightRow[sort.id as keyof ShowErrorType];
            const result = compareValues(leftValue, rightValue);

            return sort.sort === 'asc' ? result : -result;
        });
    }, [data, filter, sort]);

    return (
        <ModalPage
            className={styles.modal}
            onClose={onClose}
            onClosed={onClosed}
            tabIndex={0}
            height={500}
            header={(
                <div className={'modalFooter'}>
                    <Select
                        value={filter}
                        onChange={(event) => setFilter(event.target.value)}
                        options={[
                            {value: 'all', label: 'Показать все'},
                            {value: 'success', label: 'Показать только успешные'},
                            {value: 'error', label: 'Показать только с ошибками'},
                        ]}
                    />
                </div>
            )}
            {...props}
        >
            <div className={styles.wrap}>
                <Table
                    componentName={'showErrors'}
                    className={styles.table}
                    page={0}
                    rows={1000}
                    total={filteredAndSortedData.length}
                    hideFooter={true}
                    columns={tableColumns.showErrors}
                    data={filteredAndSortedData}
                    onEvent={handleTableEvent}
                />
            </div>
        </ModalPage>
    )
}

export default ModalShowErrors;
