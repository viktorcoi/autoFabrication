'use client'

import {
    ActionSheet,
    ActionSheetItem,
    Button,
    ButtonGroup,
    Caption,
    classNames,
    Search,
    Text,
    Tooltip
} from "@vkontakte/vkui";
import {
    Icon24BrowserBack,
    Icon24ChevronRight,
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
import {useController, useSearch} from "@/shared/hooks";
import {GetTableOptions, GetTableResponse} from "@/apiService/types";
import {ModalPageCloseReasonType, OpenModalsType} from "@/components/modals/types";
import {useAppStore} from "@/store/app/app";
import {ApiService} from "@/apiService/apiService";
import {TableDraftChanges, TableEvent} from "@/components/Table/types";
import ModalFiles from "@/components/modals/ModalFiles/ModalFiles";
import ModalProductInfo from "@/components/modals/ModalProducts/ModalProductInfo/ModalProductInfo";
import ModalManageProcessSteps from "@/components/modals/ModalProducts/ModalManageProcessSteps/ModalManageProcessSteps";
import ModalManageProcessStep from "@/components/modals/ModalProducts/ModalManageProcessStep/ModalManageProcessStep";
import {ProductsPermissionFlagsType} from "@/apiService/apiRoles/types";
import {PatchProcessStepOptions, ProcessStepTableRow} from "@/apiService/apiProcessSteps/types";
import {useSnackbarStore} from "@/store/snackbar/snackbar";
import styles from '../../../../page.module.scss';

const StepPage = () => {

    const router = useRouter();
    const params = useParams<{productId: string, processId: string, operationId: string}>();

    const productId = useMemo(() => Number(params.productId), [params.productId]);
    const processId = useMemo(() => Number(params.processId), [params.processId]);
    const operationId = useMemo(() => Number(params.operationId), [params.operationId]);
    const [loading, setLoading] = useState(true);
    const [productName, setProductName] = useState("");
    const [processName, setProcessName] = useState("");
    const [operationData, setOperationData] = useState({
        name: '',
        index: 0
    });
    const [processLocked, setProcessLocked] = useState(true);
    const [processCreatorId, setProcessCreatorId] = useState<number | null>(null);

    const {
        search,
        setSearch,
        delaySearch,
        inputRef
    } = useSearch(loading, `process-step-${operationId}`);

    const [selected, setSelected] = useState<number[]>([]);
    const [table, setTable] = useState<GetTableResponse<ProcessStepTableRow[]>>({
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
        "modal-step-files"
        | "modal-manage-steps"
        | "modal-manage-step"
        | "modal-product-info"
    >>({id: null, show: false, data: null});

    const actionSheetRef = useRef(null);
    const { TEST, permissions, user } = useAppStore(state => state);
    const addSnackbar = useSnackbarStore(state => state.addSnackbar);

    const {createController: createHeaderController} = useController([productId, processId, operationId]);
    const {
        createController,
        cancelRef
    } = useController([
        operationId,
        tableOptions.sorting,
        tableOptions.search,
        tableOptions.page,
        tableOptions.rows,
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
    }, [operationId, processId, productId, router]);

    useEffect(() => {
        mergeState({search: delaySearch}, setTableOptions);
    }, [delaySearch]);

    const getData = async () => {
        if (!Number.isFinite(operationId) || operationId <= 0) {
            return;
        }

        setLoading(true);

        const controller = createController();

        await ApiService.processStep.table.get({
            options: {
                ...tableOptions,
                operationId,
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
                    index: data.sortOrder + 1
                });
            }
        });
    };

    useEffect(() => {
        getHeaderData();
    }, [productId, processId, operationId]);

    useEffect(() => {
        getData().finally(() => setLoading(cancelRef.current));
    }, [
        operationId,
        tableOptions.sorting,
        tableOptions.search,
        tableOptions.page,
        tableOptions.rows,
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
            id: "modal-manage-step",
            show: true,
            data: id,
        });
    };

    const openWorks = (id: number) => {
        router.push(`/products/${productId}/process/${processId}/operation/${operationId}/step/${id}/work`);
    };

    const handleTableSave = async (changes: TableDraftChanges) => {
        const changeEntries = Object.entries(changes);

        if (!changeEntries.length) {
            return;
        }

        const hasInvalidName = changeEntries.some(([, item]) => (
            "name" in item && !String(item.name ?? "").trim()
        ));

        if (hasInvalidName) {
            addSnackbar({
                type: "error",
                text: "Название этапа обязательно",
            });
            return;
        }

        setLoading(true);

        const results = await Promise.all(changeEntries.map(async ([id, item]) => {
            const options: PatchProcessStepOptions = {};

            if ("name" in item) {
                options.name = String(item.name ?? "").trim();
            }

            if ("description" in item) {
                options.description = String(item.description ?? "");
            }

            if (!Object.keys(options).length) {
                return false;
            }

            const {status} = await ApiService.processStep.patch({
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
        if (e.type === "rowDoubleClick" || e.type === "cellDoubleClick") {
            openWorks((e.row as ProcessStepTableRow).id);
        }
        if (e.type === "selected") {
            setSelected(e.rowIds);
        }
        if (e.type === "editMode") {
            mergeState({editMode: e.editing}, setTableManage);
        }
        if (e.type === "editSave") {
            if (Object.keys(e.changes).length === 0) return;

            handleTableSave(e.changes).finally(() => {
                getData().finally(() => setLoading(cancelRef.current));
            });
        }
        if (e.type === "download") {
            const row = e.row as ProcessStepTableRow;

            if (e.column !== "filesDownload" || !row.files.length) return;

            setModals({
                id: "modal-step-files",
                show: true,
                data: {
                    id: row.id,
                    name: row.name,
                    files: row.files,
                }
            });
        }
        if (e.type === "contextMenu") {
            const row = e.row as ProcessStepTableRow;

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
                            onClick={() => openWorks(row.id)}
                            before={<Icon24ChevronRight width={20} height={20}/>}
                        >
                            Перейти к работам
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

    const emptyState = !delaySearch.trim() ? undefined : {
        icon: <Icon24SearchSlashOutline width={62} height={62} />,
        title: "Совпадений не найдено",
        description: "Попробуйте изменить параметры поиска",
    };

    return (
        <>
            {tableManage.actionSheet}
            {"modal-step-files" === modals.id && (
                <ModalFiles
                    itemId={modals.data?.id ?? 0}
                    name={modals.data?.name ?? ""}
                    url={"/processSteps"}
                    files={modals.data?.files ?? []}
                    open={modals.show}
                    onClose={closeModal}
                    onClosed={() => setModals({id: null, show: false, data: null})}
                />
            )}
            {"modal-manage-steps" === modals.id && (
                <ModalManageProcessSteps
                    operationId={operationId}
                    open={modals.show}
                    onClose={closeModal}
                    onClosed={() => setModals({id: null, show: false, data: null})}
                />
            )}
            {"modal-manage-step" === modals.id && (
                <ModalManageProcessStep
                    idStep={modals.data}
                    open={modals.show}
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
                                description={"Вернуться к операциям"}
                                usePortal={true}
                                placement={"top"}
                                disableTriggerOnFocus={true}
                            >
                                <div>
                                    <Link href={`/products/${productId}/process/${processId}/operation`}>
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
                                        id: "modal-manage-steps",
                                        show: true,
                                        data: null,
                                    })}
                                >
                                    Управление этапами
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
                        </div>
                    </>
                )}
            >
                <div className={classNames("island", styles.header)}>
                    <Text weight={"1"}>Этапы</Text>
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
                            {`${operationData.name} (№${operationData.index})`}
                        </Caption>
                    </div>
                </div>
                <Table
                    componentName={"process-step"}
                    editMode={access.editingProcess}
                    data={table.data}
                    columns={tableColumns.processSteps}
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

export default StepPage;
