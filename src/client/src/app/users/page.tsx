'use client'

import {ActionSheet, ActionSheetItem, Button, ButtonGroup, Counter, Search, Tooltip} from "@vkontakte/vkui";
import {
    Icon20KeyOutline, Icon20MentionOutline,
    Icon24Add,
    Icon24Filter,
    Icon24PenOutline,
    Icon24SearchSlashOutline,
    Icon24TrashSimpleOutline
} from "@vkontakte/icons";
import Container from "@/components/Container/Container";
import React, {ReactNode, useEffect, useMemo, useRef, useState} from "react";
import {useController, useFilersCount, useSearch, useStoredFilters} from "@/shared/hooks";
import {mergeState} from "@/shared/helpers";
import {ModalPageCloseReasonType, OpenModalsType} from "@/components/modals/types";
import Table from "@/components/Table/Table";
import {ApiService} from "@/apiService/apiService";
import {
    GetUsersTableFilters,
    PatchUsersTableOptions,
    UserTableRow
} from "@/apiService/apiUsers/types";
import {GetTableOptions, GetTableResponse} from "@/apiService/types";
import {tableColumns} from "@/shared/tableColumns";
import ModalManageUser from "@/components/modals/ModalManageUser/ModalManageUser";
import ModalCreateUser from "@/components/modals/ModalCreateUser/ModalCreateUser";
import {TableEvent} from "@/components/Table/types";
import ModalRemove from "@/components/modals/ModalRemove/ModalRemove";
import ModalChangePassword from "@/components/modals/ModalChangePassword/ModalChangePassword";
import ModalChangeLogin from "@/components/modals/ModalChangeLogin/ModalChangeLogin";
import ModalMultiRemove from "@/components/modals/ModalMultiRemove/ModalMultiRemove";
import {useSnackbarStore} from "@/store/snackbar/snackbar";
import {useShowErrors} from "@/store/showErrors/showErrors";
import {useAppStore} from "@/store/app/app";
import {SnackbarItem} from "@/store/snackbar/types";
import {UserPermissionFlagsType} from "@/apiService/apiAuth/types";
import ModalFiltersUsers from "@/components/modals/ModalFilters/ModalFiltersUsers/ModalFiltersUsers";

const UsersPage = () => {

    const [loading, setLoading] = useState(true);

    const {
        search,
        setSearch,
        delaySearch,
        inputRef
    } = useSearch(loading, 'users');

    const [selected, setSelected] = useState<number[]>([]);
    const [table, setTable] = useState<GetTableResponse<UserTableRow[]>>({
        data: [],
        total: 0,
    });
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
    const [tableFilters, setTableFilters] = useStoredFilters<GetUsersTableFilters>('users', {
        roleId: 0,
    });
    const [modals, setModals] = useState<OpenModalsType<
        'modal-manage-user' | 'modal-remove-user' | 'modal-create-user' | 'modal-change-password' | 'modal-change-login' | 'modal-multi-remove-user' | 'modal-filters-users'
    >>({id: null, show: false, data: null});

    const actionSheetRef = useRef(null);

    const countFilter = useFilersCount(tableFilters);
    const addSnackbar = useSnackbarStore(state => state.addSnackbar);
    const showErrors = useShowErrors(state => state);
    // TODO - (PERMISSIONS/ACCESS/ДОСТУП) dev режим защиты
    const { TEST, permissions, user, getUser } = useAppStore(state => state);

    const {
        createController,
        cancelRef
    } = useController([
        tableOptions.sorting,
        tableOptions.search,
        tableOptions.page,
        tableOptions.rows,
        tableFilters.roleId
    ]);

    useEffect(() => {
        mergeState({search: delaySearch}, setTableOptions);
    }, [delaySearch]);

    const getData = async () => {
        setLoading(true);

        const controller = createController();
        const filterOptions: Partial<GetUsersTableFilters> = {
            roleId: tableFilters.roleId || undefined,
        };

        await ApiService.users.table.get({
            options: {...tableOptions, ...filterOptions},
            controller
        }).then(({status, data}) => {
            if (status === 'success') {
                if (data.data.length === 0 && tableOptions.page !== 0) {
                    mergeState({page: tableOptions.page - 1}, setTableOptions);
                    cancelRef.current = true;
                    return;
                }
                setTable(data);
                cancelRef.current = false;
            } else if (data === 'canceled') {
                cancelRef.current = true;
            }
        })
    };

    useEffect(() => {
        getData().finally(() => setLoading(cancelRef.current));
    }, [tableOptions.sorting, tableOptions.search, tableOptions.page, tableOptions.rows, tableFilters.roleId]);

    const closeModal = (r: ModalPageCloseReasonType) => {
        mergeState({show: false}, setModals);
        if (r === 'updated-data') {
            getData().finally(() => setLoading(cancelRef.current));
        }
    };

    const handleTableSave = async (changes: PatchUsersTableOptions) => {
        setLoading(true);

        const ids = Object.keys(changes);

        await ApiService.users.table.patch({
            options: changes,
        }).then(async ({status, data}) => {

            if (status === 'success') {
                let snackbar: Omit<SnackbarItem, "id"> = {
                    type: 'success',
                    text: `Отредактировано ${data.success.length} из ${ids.length}`
                }

                if (data.error.length === ids.length) {
                    snackbar.type = 'error';
                } else if (data.error.length !== 0) {
                    snackbar.type = 'warning';
                }

                if (data.error.length) {
                    snackbar.onActionClick = () => {
                        showErrors.open(table.data.filter(({id}) => ids.includes(String(id))).map((user) => ({
                            id: user.id,
                            name: `${user.lastName} ${user.firstName}${user.middleName ? ` ${user.middleName}` : ''}`
                        })), data);
                    }
                    snackbar.action = 'Подробнее';
                }

                addSnackbar(snackbar);

                if (data.success.some(({id}) => id === user?.id)) {
                    await getUser();
                }
            }
        })
    };

    const handleRemove = () => {
        if (selected.length === 1) {
            const user = table.data.find(({id}) => id === selected[0]);
            if (user) {
                setModals({
                    id: 'modal-remove-user',
                    show: true,
                    data: {
                        id: user.id,
                        name: `${user.lastName} ${user.firstName}${user.middleName ? ` ${user.middleName}` : ''}`
                    }
                });
            }
        } else {
            const users = table.data.filter(({id}) => selected.includes(id));
            setModals({
                id: 'modal-multi-remove-user',
                show: true,
                data: users.map(user => ({id: user.id, name: `${user.lastName} ${user.firstName}${user.middleName ? ` ${user.middleName}` : ''}`}))
            })
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
            if (!access.editing) return;

            setModals({id: 'modal-manage-user', show: true, data: e.row.id});
        }
        if (e.type === 'selected') {
            setSelected(e.rowIds);
        }
        if (e.type === 'editMode') {
            mergeState({editMode: e.editing}, setTableManage);
        }
        if (e.type === 'editSave') {
            if (Object.keys(e.changes).length === 0) return;

            handleTableSave(e.changes).finally(() => {
                getData().finally(() => setLoading(cancelRef.current));
            });
        }
        if (e.type === 'contextMenu') {
            if (!access.editing && !access.resetPassword && !access.removing) return;

            const data = {
                id: e.row.id,
                name: `${e.row.lastName} ${e.row.firstName}${e.row.middleName ? ` ${e.row.middleName}` : ''}`
            };

            mergeState({actionSheet:
                <>
                    <div
                        ref={actionSheetRef}
                        style={{
                            position: 'fixed',
                            left: `${e.x}px`,
                            top: `${e.y}px`,
                            width: 1,
                            height: 1,
                            pointerEvents: 'none',
                        }}
                    />
                    <ActionSheet
                        placement={'bottom-end'}
                        popupOffsetDistance={8}
                        toggleRef={actionSheetRef}
                        onClosed={() => mergeState({actionSheet: null}, setTableManage)}
                    >
                        {access.editing && (
                            <>
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
                            </>
                        )}
                        {access.resetPassword && (
                            <ActionSheetItem
                                onClick={() => setModals({id: 'modal-change-password', show: true, data})}
                                before={<Icon20KeyOutline width={20} height={20}/>}
                            >
                                Сбросить пароль
                            </ActionSheetItem>
                        )}
                        {(!e.row.isAdmin && access.removing) && (
                            <ActionSheetItem
                                onClick={() => setModals({id: 'modal-remove-user', show: true, data})}
                                mode={'destructive'}
                                before={<Icon24TrashSimpleOutline width={20} height={20}/>}
                            >
                                Удалить
                            </ActionSheetItem>
                        )}
                    </ActionSheet>
                </>
            }, setTableManage);
        }
    };

    // TODO - (PERMISSIONS/ACCESS/ДОСТУП) dev режим защиты
    const access = useMemo(() => ({
        adding: permissions.get('/users')?.adding || !TEST,
        editing: permissions.get('/users')?.editing || !TEST,
        removing: permissions.get('/users')?.removing || !TEST,
        resetPassword: (permissions.get('/users') as UserPermissionFlagsType)?.resetPassword || !TEST
    }), [permissions, TEST]);

    return (
        <>
            {tableManage.actionSheet}
            {'modal-filters-users' === modals.id ? (
                <ModalFiltersUsers
                    onChangeFilters={setTableFilters}
                    data={tableFilters}
                    open={modals.show}
                    onClose={closeModal}
                    onClosed={() => setModals({id: null, show: false, data: null})}
                />
            ) : 'modal-multi-remove-user' === modals.id ? (
                <ModalMultiRemove
                    data={modals.data}
                    url={'/users'}
                    onClose={closeModal}
                    onClosed={() => setModals({id: null, show: false, data: null})}
                    open={modals.show}
                />
            ) : 'modal-change-login' === modals.id ? (
                <ModalChangeLogin
                    userId={modals.data?.id}
                    name={modals.data?.name}
                    onClose={closeModal}
                    onClosed={() => setModals({id: null, show: false, data: null})}
                    open={modals.show}
                />
            ) : 'modal-change-password' === modals.id ? (
                <ModalChangePassword
                    userId={modals.data?.id}
                    name={modals.data?.name}
                    onClose={closeModal}
                    onClosed={() => setModals({id: null, show: false, data: null})}
                    open={modals.show}
                />
            ) : 'modal-remove-user' === modals.id ? (
                <ModalRemove
                    removeId={modals.data?.id}
                    mode={'table'}
                    name={modals.data?.name}
                    url={'/users'}
                    onClose={closeModal}
                    onClosed={() => setModals({id: null, show: false, data: null})}
                    open={modals.show}
                />
            ) : 'modal-create-user' === modals.id ? (
                <ModalCreateUser
                    user={modals.data}
                    open={modals.show}
                    onBack={id => mergeState({id}, setModals)}
                    onClose={closeModal}
                    onClosed={() => setModals({id: null,  show: false, data: null})}
                />
            ) : 'modal-manage-user' === modals.id && (
                <ModalManageUser
                    user={modals.data}
                    idUser={modals.data}
                    open={modals.show}
                    onClose={closeModal}
                    onCreate={(id, data) => {
                        mergeState({id, data}, setModals);
                    }}
                    onClosed={() => setModals({id: null,  show: false, data: null})}
                />
            )}
            <Container
                header={(
                    <>
                        {(access.adding || access.removing) && (
                            <ButtonGroup gap={'s'}>
                                {access.adding && (
                                    <Button
                                        size={'m'}
                                        disabled={loading || tableManage.editMode}
                                        before={<Icon24Add/>}
                                        onClick={() => mergeState({id: 'modal-manage-user', show: true}, setModals)}
                                    >
                                        Добавить
                                    </Button>
                                )}
                                {access.removing && (
                                    !access.adding ? (
                                        <Button
                                            size={'m'}
                                            appearance={'negative'}
                                            disabled={loading || !selected.length || tableManage.editMode}
                                            before={<Icon24TrashSimpleOutline/>}
                                            onClick={handleRemove}
                                        >
                                            Удалить
                                        </Button>
                                    ) : (
                                        <Tooltip
                                            description={`Удалить`}
                                            usePortal={true}
                                            placement={'top'}
                                            disableTriggerOnFocus={true}
                                        >
                                            <Button
                                                size={'m'}
                                                appearance={'negative'}
                                                disabled={loading || !selected.length || tableManage.editMode}
                                                before={<Icon24TrashSimpleOutline/>}
                                                onClick={handleRemove}
                                            />
                                        </Tooltip>
                                    )
                                )}
                            </ButtonGroup>
                        )}
                        <div className={'filters'}>
                            <Search
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                disabled={loading || tableManage.editMode}
                                noPadding={true}
                                className={'search'}
                                slotProps={{ input: { getRootRef: inputRef } }}
                            />
                            <Tooltip
                                description={'Фильтры'}
                                usePortal={true}
                                placement={"top"}
                                disableTriggerOnFocus={true}
                            >
                                <div className={'filter'}>
                                    <Button
                                        disabled={loading || tableManage.editMode}
                                        onClick={() => mergeState({id: 'modal-filters-users', show: true}, setModals)}
                                        mode={'secondary'}
                                        size={'m'}
                                        before={<Icon24Filter/>}
                                    />
                                    {!!countFilter && (
                                        <Counter
                                            mode={'primary'}
                                            size={'s'}
                                            className={'filter__counter'}
                                        >
                                            {countFilter}
                                        </Counter>
                                    )}
                                </div>
                            </Tooltip>
                        </div>
                    </>
                )}
            >
                <Table
                    componentName={'users'}
                    editMode={access.editing}
                    data={table.data}
                    columns={tableColumns.user}
                    total={table.total}
                    page={tableOptions.page}
                    rows={tableOptions.rows}
                    loading={loading}
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
