'use client'

import {Button, Search} from "@vkontakte/vkui";
import {Icon24Add} from "@vkontakte/icons";
import Container from "@/components/Container/Container";
import React, {useEffect, useState} from "react";
import {useSearch} from "@/shared/hooks";
import {mergeState} from "@/shared/helpers";
import {OpenModalsType} from "@/components/modals/types";
import Table from "@/components/Table/Table";

const columnsUser = [
    {key: 'id', header: 'ID', size: 90, minSize: 80, maxSize: 140},
    {key: 'name', header: 'Name', size: 170},
    {key: 'email', header: 'Email', size: 240, minSize: 180, maxSize: 380},
    {key: 'phone', header: 'Phone', size: 180},
    {key: 'city', header: 'ID', size: 90, minSize: 80, maxSize: 140},
    {key: 'company', header: 'Name', size: 170},
    {key: 'role', header: 'Email', size: 240, minSize: 180, maxSize: 380},
    {key: 'status', header: 'Phone', size: 180},
    {key: 'department', header: 'Email', size: 240, minSize: 180, maxSize: 380},
    {key: 'createdAt', header: 'Phone', size: 180},
];

const exampleData = Array.from({length: 100}).map((_, i) => ({
    id: i,
    name: `User ${i + 1}`,
    email: `user${i + 1}@mail.com`,
    city: `City ${i + 1}`,
    company: `Company ${i + 1}`,
    role: `Role ${i + 1}`,
    department: `Department ${i + 1}`,
    salary: `Salary: ${i + 1}`,
    status: `Status: ${i + 1}`,
    createdAt: `Created At: ${i + 1}`,
    phone: `Phone: ${i + 1}`,
}))

const UsersPage = () => {

    const [loading, setLoading] = useState({
        page: true,
        modal: false,
    });

    const {
        search,
        setSearch,
        delaySearch,
        inputRef
    } = useSearch(loading.page);
    const [modals, setModals] = useState<OpenModalsType<
        'modal-manage-user' | 'modal-remove-user'
    >>({id: null, show: false, data: null});
    const [table, setTable] = useState<{
        page: number;
        rows: number;
        data: typeof exampleData;
        total: number;
    }>({
        page: 0,
        rows: 20,
        data: [],
        total: 0,
    });

    useEffect(() => {
        setTimeout(() => {
            setTable({
                page: 0,
                rows: 20,
                data: exampleData,
                total: exampleData.length,
            });
            mergeState({page: false}, setLoading)
        }, 500)
    }, [])

    return (
        <Container
            header={(
                <>
                    <Button
                        size={'m'}
                        disabled={loading.page}
                        before={<Icon24Add/>}
                        onClick={() => mergeState({id: 'modal-manage-user', show: true}, setModals)}
                    >
                        Добавить
                    </Button>
                    <Search
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        disabled={loading.page}
                        noPadding={true}
                        className={'search'}
                        slotProps={{ input: { getRootRef: inputRef } }}
                    />
                </>
            )}
        >
            <Table
                data={table.data}
                columns={columnsUser}
                total={table.total}
                page={table.page}
                rows={table.rows}
                loading={loading.page}
                onEvent={(event) => {
                    console.log(event);
                    if (event.type === 'pageChange') {
                        mergeState({page: event.page}, setTable);
                    }
                    if (event.type === 'rowsChange') {
                        mergeState({
                            page: 0,
                            rows: event.rows,
                        }, setTable);
                    }
                }}
                emptyState={{
                    title: 'Пусто',
                    description: 'Нет данных с сервера',
                }}
            />
        </Container>
    )
};

export default UsersPage;
