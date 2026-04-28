import styles from './TypeProducts.module.scss';
import {ActionSheet, ActionSheetItem, Button, ButtonGroup, classNames, Search, Tooltip} from "@vkontakte/vkui";
import Table from "@/components/Table/Table";
import React, {ReactNode, useEffect, useMemo, useState} from "react";
import {useController, useSearch} from "@/shared/hooks";
import {useSnackbarStore} from "@/store/snackbar/snackbar";
import {useShowErrors} from "@/store/showErrors/showErrors";
import {useAppStore} from "@/store/app/app";
import {
    Icon24Add,
    Icon24PenOutline,
    Icon24SearchSlashOutline,
    Icon24TrashSimpleOutline
} from "@vkontakte/icons";
import {mergeState} from "@/shared/helpers";
import {GetTableOptions, GetTableResponse} from "@/apiService/types";

import {tableColumns} from "@/shared/tableColumns";
import {TableEvent} from "@/components/Table/types";
import {ModalPageCloseReasonType, OpenModalsType} from "@/components/modals/types";
import {ApiService} from "@/apiService/apiService";
import {SnackbarItem} from "@/store/snackbar/types";
import {PatchTypeProductsTableOptions, TypeProductsTableRow} from "@/apiService/apiGuide/types";
import ModalMultiRemove from "@/components/modals/ModalMultiRemove/ModalMultiRemove";
import ModalChangeLogin from "@/components/modals/ModalChangeLogin/ModalChangeLogin";
import ModalChangePassword from "@/components/modals/ModalChangePassword/ModalChangePassword";
import ModalRemove from "@/components/modals/ModalRemove/ModalRemove";
import ModalCreateUser from "@/components/modals/ModalCreateUser/ModalCreateUser";
import ModalManageUser from "@/components/modals/ModalManageUser/ModalManageUser";
import ModalManageTypeProducts from "@/components/modals/ModalGuide/ModalManageTypeProducts/ModalManageTypeProducts";

const TypeProducts = () => {

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

    const [selected, setSelected] = useState<number[]>([]);
    const [table, setTable] = useState<GetTableResponse<TypeProductsTableRow[]>>({
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
    const [modals, setModals] = useState<OpenModalsType<
        'modal-manage-type-product' | 'modal-remove-type-product' | 'modal-multi-remove-type-product'
    >>({id: null, show: false, data: null});

    const addSnackbar = useSnackbarStore(state => state.addSnackbar);
    const showErrors = useShowErrors(state => state);
    // TODO - (PERMISSIONS/ACCESS/ДОСТУП) dev режим защиты
    const { TEST, permissions } = useAppStore(state => state);

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

        await ApiService.guide.typeProducts.table.get({
            options: {...tableOptions},
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
        getData().finally(() => mergeState({page: cancelRef.current}, setLoading));
    }, [tableOptions.sorting, tableOptions.search, tableOptions.page, tableOptions.rows]);

    const closeModal = (r: ModalPageCloseReasonType) => {
        mergeState({show: false}, setModals);
        if (r === 'updated-data') {
            getData().finally(() => mergeState({page: cancelRef.current}, setLoading));
        }
    };

    const handleTableSave = async (changes: PatchTypeProductsTableOptions) => {
        mergeState({page: true}, setLoading);

        const ids = Object.keys(changes);

        await ApiService.guide.typeProducts.table.patch({
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
                        showErrors.open(table.data.filter(({id}) => ids.includes(String(id))).map((type) => ({
                            id: type.id,
                            name: type.name
                        })), data);
                    }
                    snackbar.action = 'Подробнее';
                }

                addSnackbar(snackbar);
            }
        })
    };

    const handleRemove = () => {
        if (selected.length === 1) {
            const typeProduct = table.data.find(({id}) => id === selected[0]);
            if (typeProduct) {
                setModals({
                    id: 'modal-remove-type-product',
                    show: true,
                    data: {
                        id: typeProduct.id,
                        name: typeProduct.name
                    }
                });
            }
        } else {
            const typeProducts = table.data.filter(({id}) => selected.includes(id));
            setModals({
                id: 'modal-multi-remove-type-product',
                show: true,
                data: typeProducts.map(({id, name}) => ({id, name}))
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

            setModals({id: 'modal-manage-type-product', show: true, data: e.row.id});
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
                getData().finally(() => mergeState({page: cancelRef.current}, setLoading));
            });
        }
        if (e.type === 'contextMenu') {
            console.log('AA')
            if (!access.editing && !access.removing) return;

            mergeState({actionSheet:
                    <ActionSheet
                        placement={'bottom-end'}
                        popupOffsetDistance={8}
                        toggleRef={e.target as HTMLElement}
                        onClosed={() => mergeState({actionSheet: null}, setTableManage)}
                    >
                        {access.editing && (
                            <>
                                <ActionSheetItem
                                    onClick={() => setModals({id: 'modal-manage-type-product', show: true, data: e.row.id})}
                                    before={<Icon24PenOutline width={20} height={20}/>}
                                >
                                    Редактировать
                                </ActionSheetItem>
                            </>
                        )}
                        {(!e.row.isAdmin && access.removing) && (
                            <ActionSheetItem
                                onClick={() => setModals({id: 'modal-remove-type-product', show: true, data: {
                                    id: e.row.id,
                                    name: e.row.name
                                }})}
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

    const access = useMemo(() => ({
        adding: permissions.get('/guide')?.adding || !TEST,
        editing: permissions.get('/guide')?.editing || !TEST,
        removing: permissions.get('/guide')?.removing || !TEST,
    }), [permissions, TEST]);

    return (
        <>
            {tableManage.actionSheet}
            {'modal-multi-remove-type-product' === modals.id ? (
                <ModalMultiRemove
                    data={modals.data}
                    url={'/typeProducts'}
                    onClose={closeModal}
                    onClosed={() => setModals({id: null, show: false, data: null})}
                    onLoading={v => mergeState({modal: v}, setLoading)}
                    open={modals.show}
                    preventClose={loading.modal}
                />
            ) : 'modal-remove-type-product' === modals.id ? (
                <ModalRemove
                    removeId={modals.data?.id}
                    mode={'table'}
                    name={modals.data?.name}
                    url={'/typeProducts'}
                    onLoading={v => mergeState({modal: v}, setLoading)}
                    onClose={closeModal}
                    onClosed={() => setModals({id: null, show: false, data: null})}
                    open={modals.show}
                    preventClose={loading.modal}
                />
            ) : 'modal-manage-type-product' === modals.id && (
                <ModalManageTypeProducts
                    idTypeProducts={modals.data}
                    preventClose={loading.modal}
                    open={modals.show}
                    onClose={closeModal}
                    onLoading={v => mergeState({modal: v}, setLoading)}
                    onClosed={() => setModals({id: null,  show: false, data: null})}
                />
            )}
            <div className={styles.wrap}>
                <div className={classNames('island', styles.header)}>
                    {(access.adding || access.removing) && (
                        <ButtonGroup gap={'s'}>
                            {access.adding && (
                                <Button
                                    size={'m'}
                                    disabled={loading.page || tableManage.editMode}
                                    before={<Icon24Add/>}
                                    onClick={() => mergeState({id: 'modal-manage-type-product', show: true}, setModals)}
                                >
                                    Добавить
                                </Button>
                            )}
                            {access.removing && (
                                !access.adding ? (
                                    <Button
                                        size={'m'}
                                        appearance={'negative'}
                                        disabled={loading.page || !selected.length || tableManage.editMode}
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
                                            disabled={loading.page || !selected.length || tableManage.editMode}
                                            before={<Icon24TrashSimpleOutline/>}
                                            onClick={handleRemove}
                                        />
                                    </Tooltip>
                                )
                            )}
                        </ButtonGroup>
                    )}
                    <Search
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        disabled={loading.page || tableManage.editMode}
                        noPadding={true}
                        className={'search'}
                        slotProps={{ input: { getRootRef: inputRef } }}
                    />

                </div>
                <Table
                    componentName={'typeProducts'}
                    columns={tableColumns.typeProducts}
                    editMode={access.editing}
                    data={table.data}
                    total={table.total}
                    page={tableOptions.page}
                    rows={tableOptions.rows}
                    loading={loading.page}
                    selected={selected}
                    onEvent={onEventTable}
                    emptyState={!delaySearch.trim() ? undefined :{
                        icon: <Icon24SearchSlashOutline width={62} height={62} />,
                        title: 'Совпадений не найдено',
                        description: 'Попробуйте изменить параметры поиска',
                    }}
                />
            </div>
        </>
    )
}

export default TypeProducts;
