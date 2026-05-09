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
import {TableDraftChanges, TableEvent} from "@/components/Table/types";
import ModalProductInfo from "@/components/modals/ModalProducts/ModalProductInfo/ModalProductInfo";
import ModalManageProcessWorks from "@/components/modals/ModalProducts/ModalManageProcessWorks/ModalManageProcessWorks";
import ModalManageProcessWork from "@/components/modals/ModalProducts/ModalManageProcessWork/ModalManageProcessWork";
import ModalFiltersProcessWork from "@/components/modals/ModalFilters/ModalFiltersProcessWork/ModalFiltersProcessWork";
import {ProductsPermissionFlagsType} from "@/apiService/apiRoles/types";
import {
    GetProcessWorksTableFilters,
    PatchProcessWorkOptions,
    ProcessWorkTableRow
} from "@/apiService/apiProcessWorks/types";
import {useSnackbarStore} from "@/store/snackbar/snackbar";
import styles from '../../../../../../page.module.scss';

const defaultFilters: Omit<GetProcessWorksTableFilters, "stepId"> = {
    workGroupId: 0,
};

const parseDecimalValue = (value: unknown) => {
    const normalizedValue = String(value ?? "").trim().replace(",", ".");

    if (!normalizedValue) {
        return undefined;
    }

    const parsedValue = Number(normalizedValue);

    if (!Number.isFinite(parsedValue) || parsedValue < 0) {
        return undefined;
    }

    return parsedValue;
};

const parseCountValue = (value: unknown) => {
    const normalizedValue = String(value ?? "").trim();

    if (!normalizedValue) {
        return undefined;
    }

    const parsedValue = Number(normalizedValue);

    if (!Number.isInteger(parsedValue) || parsedValue < 1) {
        return undefined;
    }

    return parsedValue;
};

const WorkPage = () => {

    const router = useRouter();
    const params = useParams<{productId: string, processId: string, operationId: string, stepId: string}>();

    const productId = useMemo(() => Number(params.productId), [params.productId]);
    const processId = useMemo(() => Number(params.processId), [params.processId]);
    const operationId = useMemo(() => Number(params.operationId), [params.operationId]);
    const stepId = useMemo(() => Number(params.stepId), [params.stepId]);
    const [loading, setLoading] = useState(true);
    const [productName, setProductName] = useState("");
    const [processName, setProcessName] = useState("");
    const [operationData, setOperationData] = useState({
        name: "",
        index: 0,
        guideOperationId: 0,
    });
    const [stepData, setStepData] = useState({
        name: "",
        index: 0,
    });
    const [processLocked, setProcessLocked] = useState(true);
    const [processCreatorId, setProcessCreatorId] = useState<number | null>(null);

    const {
        search,
        setSearch,
        delaySearch,
        inputRef
    } = useSearch(loading, `process-work-${stepId}`);

    const [filters, setFilters] = useStoredFilters(
        `process-work-filters-${stepId}`,
        defaultFilters,
    );
    const countFilter = useFilersCount(filters);
    const [selected, setSelected] = useState<number[]>([]);
    const [table, setTable] = useState<GetTableResponse<ProcessWorkTableRow[]>>({
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
        "modal-manage-works"
        | "modal-manage-work"
        | "modal-filters"
        | "modal-product-info"
    >>({id: null, show: false, data: null});

    const actionSheetRef = useRef(null);
    const { TEST, permissions, user } = useAppStore(state => state);
    const addSnackbar = useSnackbarStore(state => state.addSnackbar);

    const {createController: createHeaderController} = useController([productId, processId, operationId, stepId]);
    const {
        createController,
        cancelRef
    } = useController([
        stepId,
        tableOptions.sorting,
        tableOptions.search,
        tableOptions.page,
        tableOptions.rows,
        filters.workGroupId,
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

        if (!Number.isFinite(operationId) || operationId <= 0) {
            router.push(`/products/${productId}/process/${processId}/operation`);
        }

        if (!Number.isFinite(stepId) || stepId <= 0) {
            router.push(`/products/${productId}/process/${processId}/operation/${operationId}/step`);
        }
    }, [operationId, processId, productId, router, stepId]);

    useEffect(() => {
        mergeState({search: delaySearch}, setTableOptions);
    }, [delaySearch]);

    const getData = async () => {
        if (!Number.isFinite(stepId) || stepId <= 0) {
            return;
        }

        setLoading(true);

        const controller = createController();

        await ApiService.processWork.table.get({
            options: {
                ...tableOptions,
                stepId,
                workGroupId: filters.workGroupId || undefined,
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
        if (
            !Number.isFinite(productId) || productId <= 0
            || !Number.isFinite(processId) || processId <= 0
            || !Number.isFinite(operationId) || operationId <= 0
            || !Number.isFinite(stepId) || stepId <= 0
        ) {
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

        await ApiService.processOperation.getById({
            id: operationId,
            controller
        }).then(({status, data}) => {
            if (status === "success") {
                if (data.processId !== processId) {
                    router.push(`/products/${productId}/process/${processId}/operation`);
                    return;
                }

                setOperationData({
                    name: data.operation.name,
                    index: data.sortOrder + 1,
                    guideOperationId: data.operationId,
                });
            }
        });

        await ApiService.processStep.getById({
            id: stepId,
            controller
        }).then(({status, data}) => {
            if (status === "success") {
                if (data.processOperationId !== operationId) {
                    router.push(`/products/${productId}/process/${processId}/operation/${operationId}/step`);
                    return;
                }

                setStepData({
                    name: data.name,
                    index: data.sortOrder + 1,
                });
            }
        });
    };

    useEffect(() => {
        getHeaderData();
    }, [productId, processId, operationId, stepId]);

    useEffect(() => {
        getData().finally(() => setLoading(cancelRef.current));
    }, [
        stepId,
        tableOptions.sorting,
        tableOptions.search,
        tableOptions.page,
        tableOptions.rows,
        filters.workGroupId,
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
            id: "modal-manage-work",
            show: true,
            data: id,
        });
    };

    const handleTableSave = async (changes: TableDraftChanges) => {
        const changeEntries = Object.entries(changes);

        if (!changeEntries.length) {
            return;
        }

        const hasInvalidTime = changeEntries.some(([, item]) => (
            ("tpz" in item && parseDecimalValue(item.tpz) === undefined)
            || ("tsht" in item && parseDecimalValue(item.tsht) === undefined)
        ));
        const hasInvalidCount = changeEntries.some(([, item]) => (
            "count" in item && parseCountValue(item.count) === undefined
        ));

        if (hasInvalidTime) {
            addSnackbar({
                type: "error",
                text: "Тпз и Тшт должны быть числами не меньше 0",
            });
            return;
        }

        if (hasInvalidCount) {
            addSnackbar({
                type: "error",
                text: "Количество должно быть целым числом не меньше 1",
            });
            return;
        }

        setLoading(true);

        const results = await Promise.all(changeEntries.map(async ([id, item]) => {
            const options: PatchProcessWorkOptions = {};

            if ("tpz" in item) {
                options.tpz = parseDecimalValue(item.tpz);
            }

            if ("tsht" in item) {
                options.tsht = parseDecimalValue(item.tsht);
            }

            if ("count" in item) {
                options.count = parseCountValue(item.count);
            }

            if ("description" in item) {
                options.description = String(item.description ?? "");
            }

            if (!Object.keys(options).length) {
                return false;
            }

            const {status} = await ApiService.processWork.patch({
                id: Number(id),
                options,
            });

            return status === "success";
        }));

        const successCount = results.filter(Boolean).length;

        addSnackbar({
            type: successCount === changeEntries.length ? "success" : successCount ? "warning" : "error",
            text: `Отредактировано ${successCount} из ${changeEntries.length}`,
        });
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
        if (e.type === "selected") {
            setSelected(e.rowIds);
        }
        if (e.type === "editMode") {
            mergeState({editMode: e.editing}, setTableManage);
        }
        if (e.type === "rowDoubleClick" || e.type === "cellDoubleClick") {
            if (e.row.canEdit) {
                openEditModal(e.row.id)
            }
        }
        if (e.type === "editSave") {
            if (Object.keys(e.changes).length === 0) return;

            handleTableSave(e.changes).finally(() => {
                getData().finally(() => setLoading(cancelRef.current));
            });
        }
        if (e.type === "contextMenu") {
            const row = e.row as ProcessWorkTableRow;

            if (!row.canEdit) {
                return;
            }

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
                            onClick={() => openEditModal(row.id)}
                            before={<Icon24PenOutline width={20} height={20}/>}
                        >
                            Редактировать
                        </ActionSheetItem>
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
            {"modal-manage-works" === modals.id && (
                <ModalManageProcessWorks
                    stepId={stepId}
                    operationId={operationData.guideOperationId}
                    open={modals.show}
                    onClose={closeModal}
                    onClosed={() => setModals({id: null, show: false, data: null})}
                />
            )}
            {"modal-manage-work" === modals.id && (
                <ModalManageProcessWork
                    idProcessWork={modals.data}
                    open={modals.show}
                    onClose={closeModal}
                    onClosed={() => setModals({id: null, show: false, data: null})}
                />
            )}
            {"modal-filters" === modals.id && (
                <ModalFiltersProcessWork
                    operationId={operationData.guideOperationId}
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
                                description={"Вернуться к этапам"}
                                usePortal={true}
                                placement={"top"}
                                disableTriggerOnFocus={true}
                            >
                                <div>
                                    <Link href={`/products/${productId}/process/${processId}/operation/${operationId}/step`}>
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
                                    disabled={loading || tableManage.editMode || operationData.guideOperationId <= 0}
                                    onClick={() => setModals({
                                        id: "modal-manage-works",
                                        show: true,
                                        data: null,
                                    })}
                                >
                                    Управление работами
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
                                        disabled={loading || tableManage.editMode || operationData.guideOperationId <= 0}
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
                    <Text weight={"1"}>Работы</Text>
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
                            <Link href={`/products/${productId}/process/${processId}/operation`}>
                                {`${processName} (ID: ${processId})`}
                            </Link>
                        </Caption>
                        <Caption level={"2"} className={styles.header__slash}>/</Caption>
                        <Caption level={"2"} className={styles.header__name}>
                            <Link href={`/products/${productId}/process/${processId}/operation/${operationId}/step`}>
                                {`${operationData.name} (№${operationData.index})`}
                            </Link>
                        </Caption>
                        <Caption level={"2"} className={styles.header__slash}>/</Caption>
                        <Caption level={"2"} className={styles.header__name}>
                            {`${stepData.name} (№${stepData.index})`}
                        </Caption>
                    </div>
                </div>
                <Table
                    componentName={"process-work"}
                    editMode={access.editingProcess}
                    data={table.data}
                    columns={tableColumns.processWorks}
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

export default WorkPage;
