'use client'

import Container from "@/components/Container/Container";
import {
    ActionSheet,
    ActionSheetItem,
    Button,
    ButtonGroup,
    Text,
    Counter,
    Search,
    Subhead,
    Tooltip
} from "@vkontakte/vkui";
import Link from "next/link";
import {
    Icon24Add,
    Icon24Filter,
    Icon24PenOutline,
    Icon24SearchSlashOutline,
    Icon24TrashSimpleOutline
} from "@vkontakte/icons";
import {mergeState} from "@/shared/helpers";
import styles from "@/app/process/page.module.scss";
import Table from "@/components/Table/Table";
import {tableColumns} from "@/shared/tableColumns";
import React, {ReactNode, useEffect, useMemo, useRef, useState} from "react";
import {useParams, useRouter} from "next/navigation";
import {useController, useFilersCount, useSearch, useStoredFilters} from "@/shared/hooks";
import {GetTableOptions, GetTableResponse} from "@/apiService/types";
import {ModalPageCloseReasonType, OpenModalsType} from "@/components/modals/types";
import {useSnackbarStore} from "@/store/snackbar/snackbar";
import {useShowErrors} from "@/store/showErrors/showErrors";
import {useAppStore} from "@/store/app/app";
import {ApiService} from "@/apiService/apiService";
import {SnackbarItem} from "@/store/snackbar/types";
import {TableEvent} from "@/components/Table/types";
import ModalMultiRemove from "@/components/modals/ModalMultiRemove/ModalMultiRemove";
import ModalRemove from "@/components/modals/ModalRemove/ModalRemove";
import {ProductsPermissionFlagsType} from "@/apiService/apiRoles/types";

const hasDateRangeValue = (value: GetProcessTableFilters["createdAt"]) => value.some((date) => date !== null);

const ProcessPage = () => {

    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const params = useParams<{id: string}>();
    const productId = useMemo(() => Number(params.id), [params.id]);
    const [nameProduct, setNameProduct] = useState('');

    const {
        search,
        setSearch,
        delaySearch,
        inputRef
    } = useSearch(loading, 'process');

    const [selected, setSelected] = useState<number[]>([]);
    const [table, setTable] = useState<GetTableResponse<ProcessTableRow[]>>({
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
    const [tableFilters, setTableFilters] = useStoredFilters<GetProcessTableFilters>('process', {
        typeProductId: 0,
        materialId: 0,
        creatorId: 0,
        createdAt: [null, null],
    });
    const [modals, setModals] = useState<OpenModalsType<
        'modal-remove-process' | 'modal-multi-remove-process' | 'modal-filters-process' | 'modal-product-files'
    >>({id: null, show: false, data: null});
    const [showInfo, setShowInfo] = useState<{
        id: number | null;
        render: boolean;
        show: boolean;
    }>({
        id: null,
        render: false,
        show: false,
    });

    const actionSheetRef = useRef(null);

    const countFilter = useFilersCount(tableFilters);
    const addSnackbar = useSnackbarStore(state => state.addSnackbar);
    const showErrors = useShowErrors(state => state);
    // TODO - (PERMISSIONS/ACCESS/ДОСТУП) dev режим защиты
    const { TEST, permissions } = useAppStore(state => state);

    const {createController: createProductController} = useController([]);

    const {
        createController,
        cancelRef
    } = useController([
        tableOptions.sorting,
        tableOptions.search,
        tableOptions.page,
        tableOptions.rows,
        tableFilters.typeProductId,
        tableFilters.materialId,
        tableFilters.creatorId,
        tableFilters.createdAt[0],
        tableFilters.createdAt[1],
    ]);

    useEffect(() => {
        mergeState({search: delaySearch}, setTableOptions);
    }, [delaySearch]);

    const getData = async () => {
        setLoading(true);

        const controller = createController();
        const filterOptions: Partial<GetProcessTableFilters> = {
            typeProductId: tableFilters.typeProductId || undefined,
            materialId: tableFilters.materialId || undefined,
            creatorId: tableFilters.creatorId || undefined,
            createdAt: hasDateRangeValue(tableFilters.createdAt) ? tableFilters.createdAt : undefined,
        };

        await ApiService.process.table.get({
            options: {...tableOptions, ...filterOptions},
            controller
        }).then(({status, data}) => {
            if (status === 'success') {
                if (data.data.length === 0 && tableOptions.page !== 0) {
                    mergeState({page: tableOptions.page - 1}, setTableOptions);
                    cancelRef.current = true;
                    return;
                }
                if (showInfo.id !== null && !data.data.some(({id}) => id === showInfo.id)) {
                    mergeState({show: false}, setShowInfo);
                }
                setTable(data);
                cancelRef.current = false;
            } else if (data === 'canceled') {
                cancelRef.current = true;
            }
        })
    };

    useEffect(() => {
        const controller = createController();
        ApiService.products.getById({
            id: productId,
            controller
        }).then(({status, data}) => {
            if (status === 'success') {
                setNameProduct(data.name);
            }
        })
    }, []);

    useEffect(() => {
        getData().finally(() => setLoading(cancelRef.current));
    }, [
        tableOptions.sorting,
        tableOptions.search,
        tableOptions.page,
        tableOptions.rows,
        tableFilters.typeProductId,
        tableFilters.materialId,
        tableFilters.creatorId,
        tableFilters.createdAt[0],
        tableFilters.createdAt[1],
    ]);

    const closeModal = (r: ModalPageCloseReasonType) => {
        mergeState({show: false}, setModals);
        if (r === 'updated-data') {
            getData().finally(() => setLoading(cancelRef.current));
        }
    };

    const handleTableSave = async (changes: PatchProcessTableOptions) => {
        setLoading(true);

        const ids = Object.keys(changes);

        await ApiService.process.table.patch({
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
                        showErrors.open(table.data.filter(({id}) => ids.includes(String(id))).map((p) => ({
                            id: p.id,
                            name: p.name
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
            const product = table.data.find(({id}) => id === selected[0]);
            if (product) {
                setModals({
                    id: 'modal-remove-process',
                    show: true,
                    data: {
                        id: product.id,
                        name: product.name
                    }
                });
            }
        } else {
            const process = table.data.filter(({id}) => selected.includes(id));
            setModals({
                id: 'modal-multi-remove-process',
                show: true,
                data: process.map(p => ({id: p.id, name: p.name}))
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
        if (e.type === 'cellClick') {
            setShowInfo({id: e.row.id, show: true, render: true});
        }
        if (e.type === 'cellDoubleClick') {
            if (!access.viewProcess) return;

            router.push(`/process/edit/${e.row.id}/process`);
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
        if (e.type === 'download') {
            const row = e.row as ProcessTableRow;

            if (e.column !== 'filesDownload' || !row.files.length) return;

            setModals({
                id: 'modal-product-files',
                show: true,
                data: {
                    id: row.id,
                    name: row.name,
                    files: row.files,
                }
            });
        }
        if (e.type === 'contextMenu') {
            if (!access.editing && !access.viewProcess && !access.removing) return;

            const data = {
                id: e.row.id,
                name: e.row.name
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
                            {access.viewProcess && (
                                <ActionSheetItem
                                    onClick={() => router.push(`/process/edit/${e.row.id}/process`)}
                                    before={<Icon24PenOutline width={20} height={20}/>}
                                >
                                    Перейти к тех. процессам
                                </ActionSheetItem>
                            )}
                            {access.editing && (
                                <>
                                    <ActionSheetItem
                                        onClick={() => router.push(`/process/edit/${e.row.id}`)}
                                        before={<Icon24PenOutline width={20} height={20}/>}
                                    >
                                        Редактировать
                                    </ActionSheetItem>
                                </>
                            )}
                            {access.removing && (
                                <ActionSheetItem
                                    onClick={() => setModals({id: 'modal-remove-process', show: true, data})}
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
        adding: permissions.get('/products')?.adding || !TEST,
        editing: permissions.get('/products')?.editing || !TEST,
        removing: permissions.get('/products')?.removing || !TEST,
        viewProcess: (permissions.get('/products') as ProductsPermissionFlagsType)?.viewProcess || !TEST
    }), [permissions, TEST]);

    return (
        <>
            {tableManage.actionSheet}
            {'modal-filters-process' === modals.id ? (
                <ModalFiltersProcess
                    onChangeFilters={setTableFilters}
                    data={tableFilters}
                    open={modals.show}
                    onClose={closeModal}
                    onClosed={() => setModals({id: null, show: false, data: null})}
                />
            ) : 'modal-multi-remove-process' === modals.id ? (
                <ModalMultiRemove
                    data={modals.data}
                    url={'/process'}
                    onClose={closeModal}
                    onClosed={() => setModals({id: null, show: false, data: null})}
                    open={modals.show}
                />
            ) : 'modal-remove-process' === modals.id && (
                <ModalRemove
                    removeId={modals.data?.id}
                    mode={'table'}
                    name={modals.data?.name}
                    url={'/process'}
                    onClose={closeModal}
                    onClosed={() => setModals({id: null, show: false, data: null})}
                    open={modals.show}
                />
            )}
            <Container
                header={(
                    <>
                        {(access.adding || access.removing) && (
                            <ButtonGroup gap={'s'}>
                                {access.adding && (
                                    <Link href={'/process/new'}>
                                        <Button
                                            size={'m'}
                                            disabled={loading || tableManage.editMode}
                                            before={<Icon24Add/>}
                                        >
                                            Добавить
                                        </Button>
                                    </Link>
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
                                        onClick={() => mergeState({id: 'modal-filters-process', show: true}, setModals)}
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
                <div className={'island'}>
                    <Text weight={'1'}>Технологические процессы</Text>
                    <Text>{nameProduct} ({productId})</Text>
                </div>
                <Table
                    componentName={'process'}
                    editMode={access.editing}
                    data={table.data}
                    columns={tableColumns.process}
                    total={table.total}
                    page={tableOptions.page}
                    rows={tableOptions.rows}
                    loading={loading}
                    selected={selected}
                    onEvent={onEventTable}
                    emptyState={(!delaySearch.trim() && !countFilter) ? undefined :{
                        icon: <Icon24SearchSlashOutline width={62} height={62} />,
                        title: 'Совпадений не найдено',
                        description: 'Попробуйте изменить параметры поиска',
                    }}
                />
            </Container>
        </>
    )
}

export default ProcessPage;
