import {ModalPage, Select} from "@vkontakte/vkui";
import {ModalShowErrorsProps} from "@/components/modals/ModalShowErrors/types";
import Table from "@/components/Table/Table";
import styles from "./ModalShowErrors.module.scss";
import {TableEvent, TableSorting} from "@/components/Table/types";
import {useMemo, useState} from "react";

const ModalShowErrors = (props: ModalShowErrorsProps) => {

    const {
        onClose,
        ...restProps
    } = props;

    const [filter, setFilter] = useState('all');
    const [sort, setSort] = useState<TableSorting>(null);

    const data = [
        {id: 1, status: 'success', name: 'A', description: 'z'},
        {id: 2, status: 'error', name: 'b', description: 'x'},
        {id: 3, status: 'success', name: 'c', description: 'c'},
        {id: 4, status: 'error', name: 'd', description: 'v'},
        {id: 5, status: 'success', name: 'e', description: 'b'},
        {id: 6, status: 'error', name: 'f', description: 'n'},
        {id: 7, status: 'success', name: 'g', description: 'm'},
        {id: 8, status: 'error', name: 'h', description: 'q'},
    ];

    const eventTable = (e: TableEvent) => {
        if (e.type === 'sortChange') {
            setSort(e.sorting)
        }
    };

    const filterData = useMemo(() => {
        return data.filter(({status}) => filter === 'all' ||  status === filter);
    }, [sort, data])

    return (
        <ModalPage
            className={styles.modal}
            onClose={onClose}
            header={(
                <div className={'modalFooter'}>
                    <Select
                        value={filter}
                        onChange={e => setFilter(e.target.value)}
                        options={[
                            {value: 'all', label: 'Показать все'},
                            {value: 'success', label: 'Показать только успешные'},
                            {value: 'error', label: 'Показать только с ошибками'}
                        ]}

                    />

                </div>
            )}
            {...restProps}
        >
            <div className={styles.wrap}>
                <Table
                    className={styles.table}
                    page={0}
                    rows={1000}
                    total={0}
                    hideFooter={true}
                    columns={[
                        {key: 'status', header: 'Статус', type: 'status', size: 95, minSize: 95, maxSize: 95, resize: false, dragging: false},
                        {key: 'name', header: 'Название', size: 200, minSize: 200, maxSize: 200, resize: false, dragging: false},
                        {key: 'description', header: 'Описание', size: 405, minSize: 405, maxSize: 405, resize: false, dragging: false},
                    ]}
                    data={filterData}
                    onEvent={eventTable}
                />
            </div>
        </ModalPage>
    )
}

export default ModalShowErrors;
