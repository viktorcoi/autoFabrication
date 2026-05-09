'use client'

import {
    ActionSheet,
    ActionSheetItem,
    Button,
    ButtonGroup,
    Caption,
    classNames,
    Counter,
    Search,
    Text,
    Tooltip
} from "@vkontakte/vkui";
import {
    Icon24BrowserBack,
    Icon24ChevronRight,
    Icon24Filter,
    Icon24PenOutline,
    Icon24SearchSlashOutline
} from "@vkontakte/icons";
import React, {ReactNode, useEffect, useMemo, useRef, useState} from "react";
import {useParams, useRouter} from "next/navigation";
import Link from "next/link";
import Container from "@/components/Container/Container";
import Table from "@/components/Table/Table";
import {tableColumns} from "@/shared/tableColumns";
import {mergeState} from "@/shared/helpers";
import {useController, useFilersCount, useSearch, useStoredFilters} from "@/shared/hooks";
import {GetTableOptions, GetTableResponse} from "@/apiService/types";
import {ModalPageCloseReasonType, OpenModalsType} from "@/components/modals/types";
import {useAppStore} from "@/store/app/app";
import {ApiService} from "@/apiService/apiService";
import {TableEvent} from "@/components/Table/types";
import ModalFiles from "@/components/modals/ModalFiles/ModalFiles";
import ModalManageProcessOperations from "@/components/modals/ModalProducts/ModalManageProcessOperations/ModalManageProcessOperations";
import ModalManageProcessOperation from "@/components/modals/ModalProducts/ModalManageProcessOperation/ModalManageProcessOperation";
import ModalFiltersProcessOperation from "@/components/modals/ModalFilters/ModalFiltersProcessOperation/ModalFiltersProcessOperation";
import ModalProductInfo from "@/components/modals/ModalProducts/ModalProductInfo/ModalProductInfo";
import {ProductsPermissionFlagsType} from "@/apiService/apiRoles/types";
import {
    GetProcessOperationsTableFilters,
    ProcessOperationTableRow
} from "@/apiService/apiProcessOperations/types";
import styles from '../../page.module.scss';

const defaultFilters: Omit<GetProcessOperationsTableFilters, "processId"> = {
    operationGroupId: 0,
};

const OperationPage = () => {

    const router = useRouter();
    const params = useParams<{processId: string, productId: string}>();

    const productId = useMemo(() => Number(params.productId), [params.productId]);
    const processId = useMemo(() => Number(params.processId), [params.processId]);
    const [loading, setLoading] = useState(true);
    const [productName, setProductName] = useState("");
    const [processName, setProcessName] = useState("");
    const [processLocked, setProcessLocked] = useState(false);
    const [processCreatorId, setProcessCreatorId] = useState<number | null>(null);

    const {
        search,
        setSearch,
        delaySearch,
        inputRef
    } = useSearch(loading, `process-operation-${processId}`);

    const [filters, setFilters] = useStoredFilters(
        `process-operation-filters-${processId}`,
        defaultFilters,
    );
    const countFilter = useFilersCount(filters);
    const [selected, setSelected] = useState<number[]>([]);
    const [table, setTable] = useState<GetTableResponse<ProcessOperationTableRow[]>>({
        data: [],
        total: 0,
    });
    const [tableOptions, setTableOptions] = useState<Required<GetTableOptions>>({
        page: 0,
        sorting: null,
        rows: 20,
        search: ""
    });
    const [tableManage, setTableManage] = useState<{editMode: boolean, actionSheet: ReactNode}>({
        editMode: false,
        actionSheet: null
    });
    const [modals, setModals] = useState<OpenModalsType<
        "modal-operation-files"
        | "modal-manage-operations"
        | "modal-manage-operation"
        | "modal-filters"
        | "modal-product-info"
    >>({id: null, show: false, data: null});

    const actionSheetRef = useRef(null);
    const { TEST, permissions, user } = useAppStore(state => state);

    const {createController: createHeaderController} = useController([productId, processId]);
    const {
        createController,
        cancelRef
    } = useController([
        processId,
        tableOptions.sorting,
        tableOptions.search,
        tableOptions.page,
        tableOptions.rows,
        filters.operationGroupId,
    ]);

    const access = useMemo(() => {
        const productPermissions = permissions.get("/products") as ProductsPermissionFlagsType | undefined;

        return {
            viewProcess: productPermissions?.viewProcess || !TEST,
            editingProcess: (!processLocked && (productPermissions?.editingProcess || processCreatorId === user?.id)) || !TEST,
        };
    }, [permissions, processLocked, processCreatorId, user?.id, TEST]);

    useEffect(() => {
        if (!Number.isFinite(productId) || productId <= 0) {
            router.push("/products");
        }

        if (!Number.isFinite(processId) || processId <= 0) {
            router.push(`/products/${productId}/process`);
        }
    }, [processId, productId, router]);

    useEffect(() => {
        mergeState({search: delaySearch}, setTableOptions);
    }, [delaySearch]);

    const getData = async () => {
        if (!Number.isFinite(processId) || processId <= 0) {
            return;
        }

        setLoading(true);

        const controller = createController();

        await ApiService.processOperation.table.get({
            options: {
                ...tableOptions,
                processId,
                operationGroupId: filters.operationGroupId || undefined,
            },
            controller
        }).then(({status, data}) => {
            if (status === "success") {
                if (data.data.length === 0 && tableOptions.page !== 0) {
                    mergeState({page: tableOptions.page - 1}, setTableOptions);
                    cancelRef.current = true;
                    return;
                }

                setTable(data);
                cancelRef.current = false;
            } else if (data === "canceled") {
                cancelRef.current = true;
            }
        });
    };

    const getHeaderData = async () => {
        if (!Number.isFinite(productId) || productId <= 0 || !Number.isFinite(processId) || processId <= 0) {
            return;
        }

        const controller = createHeaderController();

        await ApiService.products.getById({
            id: productId,
            controller
        }).then(({status, data}) => {
            if (status === "success") {
                setProductName(data.name);
            }
        });

        await ApiService.process.getById({
            id: processId,
            controller
        }).then(({status, data}) => {
            if (status === "success") {
                if (data.productId !== productId) {
                    router.push(`/products/${productId}/process`);
                    return;
                }

                setProcessName(data.name);
                setProcessLocked(!data.access);
                setProcessCreatorId(data.creatorId);
            }
        });
    };

    useEffect(() => {
        getHeaderData();
    }, [productId, processId]);

    useEffect(() => {
        getData().finally(() => setLoading(cancelRef.current));
    }, [
        processId,
        tableOptions.sorting,
        tableOptions.search,
        tableOptions.page,
        tableOptions.rows,
        filters.operationGroupId,
    ]);

    const closeModal = (reason: ModalPageCloseReasonType) => {
        mergeState({show: false}, setModals);
        if (reason === "updated-data") {
            getHeaderData();
            getData().finally(() => setLoading(cancelRef.current));
        }
    };

    const openEditModal = (id: number) => {
        setModals({
            id: "modal-manage-operation",
            show: true,
            data: id,
        });
    };

    const openSteps = (id: number) => {
        router.push(`/products/${productId}/process/${processId}/operation/${id}/step`);
    };

    const onEventTable = (e: TableEvent) => {
        if (e.type === "pageChange") {
            mergeState({page: e.page}, setTableOptions);
        }
        if (e.type === "rowsChange") {
            mergeState({
                page: 0,
                rows: e.rows,
            }, setTableOptions);
        }
        if (e.type === "sortChange") {
            mergeState({
                page: 0,
                sorting: e.sorting,
            }, setTableOptions);
        }
        if (e.type === "rowDoubleClick" || e.type === "cellDoubleClick") {
            openSteps((e.row as ProcessOperationTableRow).id);
        }
        if (e.type === "selected") {
            setSelected(e.rowIds);
        }
        if (e.type === "editMode") {
            mergeState({editMode: e.editing}, setTableManage);
        }
        if (e.type === "download") {
            const row = e.row as ProcessOperationTableRow;

            if (e.column !== "filesDownload" || !row.files.length) return;

            setModals({
                id: "modal-operation-files",
                show: true,
                data: {
                    id: row.id,
                    name: row.name,
                    files: row.files,
                }
            });
        }
        if (e.type === "contextMenu") {
            const row = e.row as ProcessOperationTableRow;

            mergeState({actionSheet:
                <>
                    <div
                        ref={actionSheetRef}
                        style={{
                            position: "fixed",
                            left: `${e.x}px`,
                            top: `${e.y}px`,
                            width: 1,
                            height: 1,
                            pointerEvents: "none",
                        }}
                    />
                    <ActionSheet
                        placement={"bottom-end"}
                        popupOffsetDistance={8}
                        toggleRef={actionSheetRef}
                        onClosed={() => mergeState({actionSheet: null}, setTableManage)}
                    >
                        <ActionSheetItem
                            onClick={() => openSteps(row.id)}
                            before={<Icon24ChevronRight width={20} height={20}/>}
                        >
                            Перейти к этапам
                        </ActionSheetItem>
                        {row.canEdit && (
                            <ActionSheetItem
                                onClick={() => openEditModal(row.id)}
                                before={<Icon24PenOutline width={20} height={20}/>}
                            >
                                Редактировать
                            </ActionSheetItem>
                        )}
                    </ActionSheet>
                </>
            }, setTableManage);
        }
    };

    const emptyState = !delaySearch.trim() && countFilter === 0 ? undefined : {
        icon: <Icon24SearchSlashOutline width={62} height={62} />,
        title: "Совпадений не найдено",
        description: "Попробуйте изменить параметры поиска",
    };

    return (
        <>
            {tableManage.actionSheet}
            {"modal-operation-files" === modals.id && (
                <ModalFiles
                    itemId={modals.data?.id ?? 0}
                    name={modals.data?.name ?? ""}
                    url={"/processOperations"}
                    files={modals.data?.files ?? []}
                    open={modals.show}
                    onClose={closeModal}
                    onClosed={() => setModals({id: null, show: false, data: null})}
                />
            )}
            {"modal-manage-operations" === modals.id && (
                <ModalManageProcessOperations
                    processId={processId}
                    open={modals.show}
                    onClose={closeModal}
                    onClosed={() => setModals({id: null, show: false, data: null})}
                />
            )}
            {"modal-manage-operation" === modals.id && (
                <ModalManageProcessOperation
                    idProcessOperation={modals.data}
                    open={modals.show}
                    onClose={closeModal}
                    onClosed={() => setModals({id: null, show: false, data: null})}
                />
            )}
            {"modal-filters" === modals.id && (
                <ModalFiltersProcessOperation
                    data={filters}
                    open={modals.show}
                    onChangeFilters={(filters) => {
                        setFilters(filters);
                        mergeState({page: 0}, setTableOptions);
                    }}
                    onClose={closeModal}
                    onClosed={() => setModals({id: null, show: false, data: null})}
                />
            )}
            {"modal-product-info" === modals.id && (
                <ModalProductInfo
                    productId={productId}
                    open={modals.show}
                    onClose={closeModal}
                    onClosed={() => setModals({id: null, show: false, data: null})}
                />
            )}
            <Container
                header={(
                    <>
                        <ButtonGroup gap={"s"}>
                            <Tooltip
                                description={"Вернуться к процессам"}
                                usePortal={true}
                                placement={"top"}
                                disableTriggerOnFocus={true}
                            >
                                <div>
                                    <Link href={`/products/${productId}/process`}>
                                        <Button
                                            mode={"secondary"}
                                            size={"m"}
                                            before={<Icon24BrowserBack/>}
                                        />
                                    </Link>
                                </div>
                            </Tooltip>
                            {access.editingProcess && (
                                <Button
                                    size={"m"}
                                    disabled={loading || tableManage.editMode}
                                    onClick={() => setModals({
                                        id: "modal-manage-operations",
                                        show: true,
                                        data: null,
                                    })}
                                >
                                    Управление операциями
                                </Button>
                            )}
                        </ButtonGroup>
                        <div className={"filters"}>
                            <Search
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                disabled={loading || tableManage.editMode}
                                noPadding={true}
                                className={"search"}
                                slotProps={{ input: { getRootRef: inputRef } }}
                            />
                            <Tooltip
                                description={"Фильтры"}
                                usePortal={true}
                                placement={"top"}
                                disableTriggerOnFocus={true}
                            >
                                <div className={"filter"}>
                                    <Button
                                        disabled={loading || tableManage.editMode}
                                        onClick={() => setModals({
                                            id: "modal-filters",
                                            show: true,
                                            data: null,
                                        })}
                                        mode={"secondary"}
                                        size={"m"}
                                        before={<Icon24Filter/>}
                                    />
                                    {!!countFilter && (
                                        <Counter
                                            mode={"primary"}
                                            size={"s"}
                                            className={"filter__counter"}
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
                <div className={classNames("island", styles.header)}>
                    <Text weight={"1"}>Операции</Text>
                    <div className={styles.header__adres}>
                        <Caption
                            level={"2"}
                            className={styles.header__modal}
                            onClick={() => setModals({
                                id: "modal-product-info",
                                show: true,
                                data: null,
                            })}
                        >
                            {`${productName} (ID: ${productId})`}
                        </Caption>
                        <Caption level={"2"} className={styles.header__slash}>/</Caption>
                        <Caption level={"2"} className={styles.header__name}>
                            {`${processName} (ID: ${processId})`}
                        </Caption>
                    </div>
                </div>
                <Table
                    componentName={"process-operation"}
                    editMode={false}
                    data={table.data}
                    columns={tableColumns.processOperation}
                    total={table.total}
                    page={tableOptions.page}
                    rows={tableOptions.rows}
                    loading={loading}
                    selected={selected}
                    onEvent={onEventTable}
                    emptyState={emptyState}
                />
            </Container>
        </>
    );
};

export default OperationPage;
