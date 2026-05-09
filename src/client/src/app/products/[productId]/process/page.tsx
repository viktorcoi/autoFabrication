'use client'

import {
    ActionSheet,
    ActionSheetItem,
    Button,
    ButtonGroup, Caption, classNames, Counter,
    Search,
    Text,
    Tooltip
} from "@vkontakte/vkui";
import {
    Icon24Add, Icon24BrowserBack, Icon24ChevronRight,
    Icon24Filter,
    Icon24PenOutline,
    Icon24SearchSlashOutline,
    Icon24TrashSimpleOutline
} from "@vkontakte/icons";
import React, {ReactNode, useEffect, useMemo, useRef, useState} from "react";
import {useParams, useRouter} from "next/navigation";
import Container from "@/components/Container/Container";
import Table from "@/components/Table/Table";
import {tableColumns} from "@/shared/tableColumns";
import {mergeState} from "@/shared/helpers";
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
import ModalFiles from "@/components/modals/ModalFiles/ModalFiles";
import ModalManageProcess from "@/components/modals/ModalProducts/ModalManageProcess/ModalManageProcess";
import {ProductsPermissionFlagsType} from "@/apiService/apiRoles/types";
import {GetProcessTableFilters, PatchProcessTableOptions, ProcessTableRow} from "@/apiService/apiProcesses/types";
import Link from "next/link";
import ModalFiltersProcess from "@/components/modals/ModalFilters/ModalFiltersProcess/ModalFiltersProcess";
import styles from "./page.module.scss";

const hasDateRangeValue = (value: GetProcessTableFilters["updatedAt"]) => value.some((date) => date !== null);

const ProcessPage = () => {

    const router = useRouter();
    const params = useParams<{productId: string}>();
    const productId = useMemo(() => Number(params.productId), [params.productId]);
    const [loading, setLoading] = useState(true);
    const [product, setProduct] = useState<{
        name: string;
        materialId: number | null;
    }>({
        name: "",
        materialId: null,
    });

    const {
        search,
        setSearch,
        delaySearch,
        inputRef
    } = useSearch(loading, `process-${productId}`);

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
    const [tableFilters, setTableFilters] = useStoredFilters<Omit<GetProcessTableFilters, "productId">>(`process-${productId}`, {
        creatorId: 0,
        blankId: 0,
        updatedAt: [null, null],
    });
    const [modals, setModals] = useState<OpenModalsType<
        'modal-manage-process' | 'modal-remove-process' | 'modal-multi-remove-process' | 'modal-process-files' | 'modal-filters-process'
    >>({id: null, show: false, data: null});

    const actionSheetRef = useRef(null);
    const countFilter = useFilersCount(tableFilters);
    const addSnackbar = useSnackbarStore(state => state.addSnackbar);
    const showErrors = useShowErrors(state => state);
    const { TEST, permissions } = useAppStore(state => state);

    const {createController: createProductController} = useController([productId]);
    const {
        createController,
        cancelRef
    } = useController([
        productId,
        tableOptions.sorting,
        tableOptions.search,
        tableOptions.page,
        tableOptions.rows,
        tableFilters.creatorId,
        tableFilters.blankId,
        tableFilters.updatedAt[0],
        tableFilters.updatedAt[1],
    ]);

    useEffect(() => {
        if (!Number.isFinite(productId) || productId <= 0) {
            router.push('/products');
        }
    }, [productId, router]);

    useEffect(() => {
        mergeState({search: delaySearch}, setTableOptions);
    }, [delaySearch]);

    const getData = async () => {
        if (!Number.isFinite(productId) || productId <= 0) {
            return;
        }

        setLoading(true);

        const controller = createController();
        const filterOptions: Partial<Omit<GetProcessTableFilters, "productId">> = {
            creatorId: tableFilters.creatorId || undefined,
            blankId: tableFilters.blankId || undefined,
            updatedAt: hasDateRangeValue(tableFilters.updatedAt) ? tableFilters.updatedAt : undefined,
        };

        await ApiService.process.table.get({
            options: {...tableOptions, ...filterOptions, productId},
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
        if (!Number.isFinite(productId) || productId <= 0) {
            return;
        }

        const controller = createProductController();

        ApiService.products.getById({
            id: productId,
            controller
        }).then(({status, data}) => {
            if (status === 'success') {
                setProduct({
                    name: data.name,
                    materialId: data.materialId,
                });
            }
        });
    }, [productId]);

    useEffect(() => {
        getData().finally(() => setLoading(cancelRef.current));
    }, [
        productId,
        tableOptions.sorting,
        tableOptions.search,
        tableOptions.page,
        tableOptions.rows,
        tableFilters.creatorId,
        tableFilters.blankId,
        tableFilters.updatedAt[0],
        tableFilters.updatedAt[1],
    ]);

    const closeModal = (reason: ModalPageCloseReasonType) => {
        mergeState({show: false}, setModals);
        if (reason === 'updated-data') {
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
                        showErrors.open(table.data.filter(({id}) => ids.includes(String(id))).map((process) => ({
                            id: process.id,
                            name: process.name
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
            const process = table.data.find(({id}) => id === selected[0]);
            if (process) {
                setModals({
                    id: 'modal-remove-process',
                    show: true,
                    data: {
                        id: process.id,
                        name: process.name
                    }
                });
            }
        } else {
            const processes = table.data.filter(({id}) => selected.includes(id));
            setModals({
                id: 'modal-multi-remove-process',
                show: true,
                data: processes.map(process => ({id: process.id, name: process.name}))
            })
        }
    };

    const openManageModal = (idProcess: number | null) => {
        setModals({
            id: 'modal-manage-process',
            show: true,
            data: {
                id: idProcess,
            }
        });
    };

    const toggleAccess = async (row: ProcessTableRow) => {
        if (!row.canChangeAccess) {
            return;
        }

        setLoading(true);

        await ApiService.process.patchAccess({
            id: row.id,
            disabled: row.access,
        }).then(({status}) => {
            if (status === 'success') {
                addSnackbar({
                    type: 'success',
                    text: row.access ? 'Техпроцесс закрыт' : 'Техпроцесс открыт',
                });
            }
        }).finally(() => {
            getData().finally(() => setLoading(cancelRef.current));
        });
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
            const row = e.row as ProcessTableRow;
            if (!row.canEdit) return;

            router.push(`/products/${productId}/process/${e.row.id}/operation`);
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
                id: 'modal-process-files',
                show: true,
                data: {
                    id: row.id,
                    name: row.name,
                    files: row.files,
                }
            });
        }
        if (e.type === 'access') {
            toggleAccess(e.row as ProcessTableRow);
        }
        if (e.type === 'contextMenu') {
            const row = e.row as ProcessTableRow;
            if (!row.canEdit && !access.removingProcess) return;

            const data = {
                id: row.id,
                name: row.name
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
                        <ActionSheetItem
                            onClick={() => router.push(`/products/${productId}/process/${e.row.id}/operation`)}
                            before={<Icon24ChevronRight width={20} height={20}/>}
                        >
                            Перейти к операциям
                        </ActionSheetItem>
                        {row.canEdit && (
                            <ActionSheetItem
                                onClick={() => openManageModal(row.id)}
                                before={<Icon24PenOutline width={20} height={20}/>}
                            >
                                Редактировать
                            </ActionSheetItem>
                        )}
                        {access.removingProcess && (
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

    const access = useMemo(() => {
        const productPermissions = permissions.get('/products') as ProductsPermissionFlagsType | undefined;

        return {
            viewProcess: productPermissions?.viewProcess || !TEST,
            addingProcess: productPermissions?.addingProcess || !TEST,
            editingProcess: productPermissions?.editingProcess || !TEST,
            removingProcess: productPermissions?.removingProcess || !TEST,
            changeDisabledProcess: productPermissions?.changeDisabledProcess || !TEST,
        };
    }, [permissions, TEST]);

    return (
        <>
            {tableManage.actionSheet}
            {'modal-filters-process' === modals.id ? (
                <ModalFiltersProcess
                    onChangeFilters={setTableFilters}
                    data={tableFilters}
                    productMaterialId={product.materialId}
                    open={modals.show}
                    onClose={closeModal}
                    onClosed={() => setModals({id: null, show: false, data: null})}
                />
            ) : 'modal-manage-process' === modals.id ? (
                <ModalManageProcess
                    idProcess={modals.data?.id ?? null}
                    productId={productId}
                    productMaterialId={product.materialId}
                    open={modals.show}
                    onClose={closeModal}
                    onClosed={() => setModals({id: null, show: false, data: null})}
                />
            ) : 'modal-multi-remove-process' === modals.id ? (
                <ModalMultiRemove
                    data={modals.data}
                    url={'/processes'}
                    onClose={closeModal}
                    onClosed={() => setModals({id: null, show: false, data: null})}
                    open={modals.show}
                />
            ) : 'modal-process-files' === modals.id ? (
                <ModalFiles
                    itemId={modals.data?.id ?? 0}
                    name={modals.data?.name ?? ''}
                    url={'/processes'}
                    files={modals.data?.files ?? []}
                    open={modals.show}
                    onClose={closeModal}
                    onClosed={() => setModals({id: null, show: false, data: null})}
                />
            ) : 'modal-remove-process' === modals.id && (
                <ModalRemove
                    removeId={modals.data?.id}
                    mode={'table'}
                    name={modals.data?.name}
                    url={'/processes'}
                    onClose={closeModal}
                    onClosed={() => setModals({id: null, show: false, data: null})}
                    open={modals.show}
                />
            )}
            <Container
                header={(
                    <>
                        <ButtonGroup gap={'s'}>
                            <Tooltip
                                description={'Вернуться к изделиям'}
                                usePortal={true}
                                placement={"top"}
                                disableTriggerOnFocus={true}
                            >
                                <div>
                                    <Link
                                        href={'/products'}
                                    >
                                        <Button
                                            mode={'secondary'}
                                            size={'m'}
                                            before={<Icon24BrowserBack/>}
                                        />
                                    </Link>
                                </div>
                            </Tooltip>
                            {(access.addingProcess || access.removingProcess) && (
                                <>
                                    {access.addingProcess && (
                                        <Button
                                            size={'m'}
                                            disabled={loading || tableManage.editMode}
                                            before={<Icon24Add/>}
                                            onClick={() => openManageModal(null)}
                                        >
                                            Добавить
                                        </Button>
                                    )}
                                    {access.removingProcess && (
                                        !access.addingProcess ? (
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
                                </>
                            )}
                        </ButtonGroup>
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
                <div className={classNames('island', styles.header)}>
                    <Text weight={'1'}>Технологические процессы</Text>
                    <Caption level={'2'} className={styles.header__name}>{`${product.name} (ID: ${productId})`}</Caption>
                </div>
                <Table
                    componentName={'process'}
                    editMode={access.viewProcess}
                    data={table.data}
                    columns={tableColumns.process}
                    total={table.total}
                    page={tableOptions.page}
                    rows={tableOptions.rows}
                    loading={loading}
                    selected={selected}
                    onEvent={onEventTable}
                    emptyState={!delaySearch.trim() ? undefined :{
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
