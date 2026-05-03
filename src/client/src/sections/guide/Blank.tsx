import {ActionSheet, ActionSheetItem, Button, ButtonGroup, classNames, Search, Tooltip} from "@vkontakte/vkui";
import Table from "@/components/Table/Table";
import React, {ReactNode, useEffect, useMemo, useRef, useState} from "react";
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
import {BlankTableRow, PatchBlankTableOptions} from "@/apiService/apiGuide/types";
import ModalMultiRemove from "@/components/modals/ModalMultiRemove/ModalMultiRemove";
import ModalRemove from "@/components/modals/ModalRemove/ModalRemove";
import ModalManageBlank from "@/components/modals/ModalGuide/ModalManageBlank/ModalManageBlank";
import styles from './GuideSections.module.scss';

const Blank = (
    {onLoading}: {onLoading(value: boolean): void}
) => {

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
    const [table, setTable] = useState<GetTableResponse<BlankTableRow[]>>({
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
        'modal-manage-blank' | 'modal-remove-blank' | 'modal-multi-remove-blank'
    >>({id: null, show: false, data: null});

    const actionSheetRef = useRef(null);

    const addSnackbar = useSnackbarStore(state => state.addSnackbar);
    const showErrors = useShowErrors(state => state);
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

        await ApiService.guide.blank.table.get({
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

    const handleTableSave = async (changes: PatchBlankTableOptions) => {
        mergeState({page: true}, setLoading);
        onLoading(true);

        const ids = Object.keys(changes);

        await ApiService.guide.blank.table.patch({
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
                        showErrors.open(table.data.filter(({id}) => ids.includes(String(id))).map((blank) => ({
                            id: blank.id,
                            name: blank.name
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
            const blank = table.data.find(({id}) => id === selected[0]);
            if (blank) {
                setModals({
                    id: 'modal-remove-blank',
                    show: true,
                    data: {
                        id: blank.id,
                        name: blank.name
                    }
                });
            }
        } else {
            const blanks = table.data.filter(({id}) => selected.includes(id));
            setModals({
                id: 'modal-multi-remove-blank',
                show: true,
                data: blanks.map(({id, name}) => ({id, name}))
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

            setModals({id: 'modal-manage-blank', show: true, data: e.row.id});
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
                onLoading(false);
                getData().finally(() => mergeState({page: cancelRef.current}, setLoading));
            });
        }
        if (e.type === 'contextMenu') {
            if (!access.editing && !access.removing) return;

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
                            <ActionSheetItem
                                onClick={() => setModals({id: 'modal-manage-blank', show: true, data: e.row.id})}
                                before={<Icon24PenOutline width={20} height={20}/>}
                            >
                                Редактировать
                            </ActionSheetItem>
                        )}
                        {access.removing && (
                            <ActionSheetItem
                                onClick={() => setModals({id: 'modal-remove-blank', show: true, data: {
                                        id: e.row.id,
                                        name: e.row.name
                                    }})}
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

    const access = useMemo(() => ({
        adding: permissions.get('/guide')?.adding || !TEST,
        editing: permissions.get('/guide')?.editing || !TEST,
        removing: permissions.get('/guide')?.removing || !TEST,
    }), [permissions, TEST]);

    return (
        <>
            {tableManage.actionSheet}
            {'modal-multi-remove-blank' === modals.id ? (
                <ModalMultiRemove
                    data={modals.data}
                    url={'/blank'}
                    onClose={closeModal}
                    onClosed={() => setModals({id: null, show: false, data: null})}
                    onLoading={v => mergeState({modal: v}, setLoading)}
                    open={modals.show}
                    preventClose={loading.modal}
                />
            ) : 'modal-remove-blank' === modals.id ? (
                <ModalRemove
                    removeId={modals.data?.id}
                    mode={'table'}
                    name={modals.data?.name}
                    url={'/blank'}
                    onLoading={v => mergeState({modal: v}, setLoading)}
                    onClose={closeModal}
                    onClosed={() => setModals({id: null, show: false, data: null})}
                    open={modals.show}
                    preventClose={loading.modal}
                />
            ) : 'modal-manage-blank' === modals.id && (
                <ModalManageBlank
                    idBlank={modals.data}
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
                                    onClick={() => mergeState({id: 'modal-manage-blank', show: true}, setModals)}
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
                    componentName={'blank'}
                    columns={tableColumns.blank}
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

export default Blank;
