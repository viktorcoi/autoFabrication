'use client'

import {ActionSheet, ActionSheetItem, Button, ButtonGroup, Search, Tooltip} from "@vkontakte/vkui";
import {
    Icon20KeyOutline, Icon20MentionOutline,
    Icon24Add,
    Icon24PenOutline,
    Icon24SearchSlashOutline,
    Icon24TrashSimpleOutline
} from "@vkontakte/icons";
import Container from "@/components/Container/Container";
import React, {ReactNode, useEffect, useState} from "react";
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
import ModalRemove from "@/components/modals/ModalRemove/ModalRemove";
import ModalChangePassword from "@/components/modals/ModalChangePassword/ModalChangePassword";
import ModalChangeLogin from "@/components/modals/ModalChangeLogin/ModalChangeLogin";

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
    const [tableManage, setTableManage] = useState<{editMode: boolean, actionSheet: ReactNode}>({
        editMode: false,
        actionSheet: null
    });
    const [modals, setModals] = useState<OpenModalsType<
        'modal-manage-user' | 'modal-remove-user' | 'modal-create-user' | 'modal-change-password' | 'modal-change-login'
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
            console.log(e);
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
        }
        if (e.type === 'editMode') {
            mergeState({editMode: e.editing}, setTableManage);
        }
        if (e.type === 'contextMenu') {
            const data = {
                id: e.row.id,
                name: `${e.row.lastName} ${e.row.firstName}${e.row.middleName ? ` ${e.row.middleName}` : ''}`
            };

            console.log(e)

            mergeState({actionSheet:
                <ActionSheet
                    placement={'bottom-end'}
                    popupOffsetDistance={8}
                    toggleRef={e.target as HTMLElement}
                    onClosed={() => mergeState({actionSheet: null}, setTableManage)}
                >
                    <ActionSheetItem
                        onClick={() => setModals({id: 'modal-manage-user', show: true, data: e.row.id})}
                        before={<Icon24PenOutline width={20} height={20}/>}
                    >
                        Редактировать
                    </ActionSheetItem>
                    <ActionSheetItem
                        onClick={() => setModals({id: 'modal-change-login', show: true, data})}
                        before={<Icon20MentionOutline width={20} height={20}/>}
                    >
                        Изменить логин
                    </ActionSheetItem>
                    <ActionSheetItem
                        onClick={() => setModals({id: 'modal-change-password', show: true, data})}
                        before={<Icon20KeyOutline width={20} height={20}/>}
                    >
                        Сбросить пароль
                    </ActionSheetItem>
                    {!e.row.isAdmin && (
                        <ActionSheetItem
                            onClick={() => setModals({id: 'modal-remove-user', show: true, data})}
                            mode={'destructive'}
                            before={<Icon24TrashSimpleOutline width={20} height={20}/>}
                        >
                            Удалить
                        </ActionSheetItem>
                    )}
                </ActionSheet>,
            }, setTableManage);
        }
    };

    return (
        <>
            {tableManage.actionSheet}
            {'modal-change-login' === modals.id ? (
                <ModalChangeLogin
                    userId={modals.data?.id}
                    name={modals.data?.name}
                    onLoading={v => mergeState({modal: v}, setLoading)}
                    onClose={closeModal}
                    onClosed={() => setModals({id: null, show: false, data: null})}
                    open={modals.show}
                    preventClose={loading.modal}
                />
            ) : 'modal-change-password' === modals.id ? (
                <ModalChangePassword
                    userId={modals.data?.id}
                    name={modals.data?.name}
                    onLoading={v => mergeState({modal: v}, setLoading)}
                    onClose={closeModal}
                    onClosed={() => setModals({id: null, show: false, data: null})}
                    open={modals.show}
                    preventClose={loading.modal}
                />
            ) : 'modal-remove-user' === modals.id ? (
                <ModalRemove
                    removeId={modals.data?.id}
                    mode={'table'}
                    name={modals.data?.name}
                    url={'/users'}
                    onLoading={v => mergeState({modal: v}, setLoading)}
                    onClose={closeModal}
                    onClosed={() => setModals({id: null, show: false, data: null})}
                    open={modals.show}
                    preventClose={loading.modal}
                />
            ) : 'modal-create-user' === modals.id ? (
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
                                disabled={loading.page || tableManage.editMode}
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
                                    disabled={loading.page || !selected.length || tableManage.editMode}
                                    before={<Icon24TrashSimpleOutline/>}
                                />
                            </Tooltip>
                        </ButtonGroup>
                        <Search
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            disabled={loading.page || tableManage.editMode}
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
                        icon: <Icon24SearchSlashOutline width={62} height={62} />,
                        title: 'Совпадений не найдено',
                        description: 'Попробуйте изменить параметры поиска',
                    }}
                />
            </Container>
        </>
    )
};

export default UsersPage;
