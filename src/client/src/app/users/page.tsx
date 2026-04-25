'use client'

import {Button, ButtonGroup, Search, Tooltip} from "@vkontakte/vkui";
import {Icon24Add, Icon24TrashSimpleOutline} from "@vkontakte/icons";
import Container from "@/components/Container/Container";
import React, {useEffect, useState} from "react";
import {useController, useSearch} from "@/shared/hooks";
import {mergeState} from "@/shared/helpers";
import {ModalPageCloseReasonType, OpenModalsType} from "@/components/modals/types";
import Table from "@/components/Table/Table";
import {ApiService} from "@/apiService/apiService";
import {UserTableRow} from "@/apiService/apiUsers/types";
import {GetTableOptions, GetTableResponse} from "@/apiService/types";
import {tableColumns} from "@/shared/tableColumns";
import ModalManageUser from "@/components/modals/ModalManageUser/ModalManageUser";
import ModalCreateUser from "@/components/modals/ModalCreateUser/ModalCreateUser";
import {TableEvent} from "@/components/Table/types";

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

    const [table, setTable] = useState<GetTableResponse<UserTableRow[]>>({
        data: [],
        total: 0,
    });
    const [selected, setSelected] = useState<number[]>([]);
    const [tableOptions, setTableOptions] = useState<Required<GetTableOptions>>({
        page: 0,
        sorting: null,
        rows: 20,
        search: ''
    });
    const [modals, setModals] = useState<OpenModalsType<
        'modal-manage-user' | 'modal-remove-users' | 'modal-create-user'
    >>({id: null, show: false, data: null});

    const {
        createController,
        cancelRef
    } = useController([tableOptions.sorting, tableOptions.search, tableOptions.page, tableOptions.rows]);

    useEffect(() => {
        mergeState({search: delaySearch}, setTableOptions);
    }, [delaySearch]);

    const getData = async () => {
        mergeState({page: true}, setLoading);

        const controller = createController();

        await ApiService.users.table.get({
            options: {...tableOptions},
            controller
        }).then(({status, data}) => {
            if (status === 'success') {
                setTable(data);
                cancelRef.current = false;
            } else if (data === 'canceled') {
                cancelRef.current = true;
            }
        })
    };

    useEffect(() => {
        getData().finally(() => mergeState({page: cancelRef.current}, setLoading));
    }, [tableOptions.sorting, tableOptions.search, tableOptions.page, tableOptions.rows]);

    const closeModal = (r: ModalPageCloseReasonType) => {
        mergeState({show: false}, setModals);
        if (r === 'updated-data') {
            getData().finally(() => mergeState({page: cancelRef.current}, setLoading));
        }
    };

    const onEventTable = (e: TableEvent) => {
        if (e.type === 'pageChange') {
            mergeState({page: e.page}, setTableOptions);
        }
        if (e.type === 'rowsChange') {
            mergeState({
                page: 0,
                rows: e.rows,
            }, setTableOptions);
        }
        if (e.type === 'sortChange') {
            mergeState({
                page: 0,
                sorting: e.sorting,
            }, setTableOptions);
        }
        if (e.type === 'cellDoubleClick') {
            setModals({id: 'modal-manage-user', show: true, data: e.row.id});
        }
        if (e.type === 'selected') {
            setSelected(e.rowIds);
            console.log(selected)
        }
    };

    return (
        <>
            {'modal-create-user' === modals.id ? (
                <ModalCreateUser
                    user={modals.data}
                    open={modals.show}
                    onBack={id => mergeState({id}, setModals)}
                    onClose={closeModal}
                    preventClose={loading.modal}
                    onLoading={v => mergeState({modal: v}, setLoading)}
                    onClosed={() => setModals({id: null,  show: false, data: null})}
                />
            ) : 'modal-manage-user' === modals.id && (
                <ModalManageUser
                    user={modals.data}
                    idUser={modals.data}
                    preventClose={loading.modal}
                    open={modals.show}
                    onClose={closeModal}
                    onCreate={(id, data) => {
                        mergeState({id, data}, setModals);
                    }}
                    onLoading={v => mergeState({modal: v}, setLoading)}
                    onClosed={() => setModals({id: null,  show: false, data: null})}
                />
            )}
            <Container
                header={(
                    <>
                        <ButtonGroup
                            gap={'s'}
                        >
                            <Button
                                size={'m'}
                                disabled={loading.page}
                                before={<Icon24Add/>}
                                onClick={() => mergeState({id: 'modal-manage-user', show: true}, setModals)}
                            >
                                Добавить
                            </Button>
                            <Tooltip
                                description={`Удалить`}
                                usePortal={true}
                                placement={'top'}
                            >
                                <Button
                                    size={'m'}
                                    appearance={'negative'}
                                    disabled={loading.page}
                                    before={<Icon24TrashSimpleOutline/>}
                                />
                            </Tooltip>
                        </ButtonGroup>
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
                    columns={tableColumns.user}
                    total={table.total}
                    page={tableOptions.page}
                    rows={tableOptions.rows}
                    loading={loading.page}
                    selected={selected}
                    onEvent={onEventTable}
                    emptyState={{
                        title: 'Пусто',
                        description: 'Нет данных с сервера',
                    }}
                />
            </Container>
        </>
    )
};

export default UsersPage;
