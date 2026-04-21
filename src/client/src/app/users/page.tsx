'use client'

import {Button, Search} from "@vkontakte/vkui";
import {Icon24Add} from "@vkontakte/icons";
import Container from "@/components/Container/Container";
import React, {useEffect, useState} from "react";
import {useSearch} from "@/shared/hooks";
import {mergeState} from "@/shared/helpers";
import {ModalPageCloseReasonType, OpenModalsType} from "@/components/modals/types";
import Table from "@/components/Table/Table";
import {ApiService} from "@/apiService/apiService";
import {UserTableRow} from "@/apiService/apiUsers/types";
import {GetTableResponse} from "@/apiService/types";
import {tableColumns} from "@/shared/tableColumns";
import ModalManageUser from "@/components/modals/ModalManageUser/ModalManageUser";

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
        'modal-manage-user' | 'modal-remove-user' | 'modal-create-user'
    >>({id: null, show: false, data: null});
    const [table, setTable] = useState<GetTableResponse<UserTableRow[]>>({
        page: 0,
        rows: 20,
        data: [],
        total: 0,
    });

    const getData = async () => {
        await ApiService.users.table.get({

        }).then(({status, data}) => {
            if (status === 'success') {
                console.log(data);
                setTable(data);
            }
        })
    };

    useEffect(() => {
        getData().finally(() => mergeState({page: false}, setLoading));
        // setTimeout(() => {
        //     setTable({
        //         page: 0,
        //         rows: 20,
        //         data: exampleData,
        //         total: 1000,
        //     });
        //     mergeState({page: false}, setLoading)
        // }, 500);
    }, []);

    const closeModal = (r: ModalPageCloseReasonType) => {
        mergeState({show: false}, setModals);
        if (r === 'updated-data') {
            getData().finally(() => mergeState({page: false}, setLoading));
        }
    };

    return (
        <>
            {'modal-manage-user' === modals.id && (
                <ModalManageUser
                    idUser={modals.data}
                    preventClose={loading.modal}
                    open={modals.show}
                    onClose={closeModal}
                    onCreate={(modal, data) => {
                        mergeState({id: modal, data}, setModals);
                    }}
                    onLoading={v => mergeState({modal: v}, setLoading)}
                    onClosed={() => setModals({id: null,  show: false, data: null})}
                />
            )}
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
                    columns={tableColumns.user}
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
        </>
    )
};

export default UsersPage;
