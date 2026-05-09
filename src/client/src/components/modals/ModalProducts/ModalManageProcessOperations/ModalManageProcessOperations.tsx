import {
    Button,
    ButtonGroup,
    Cell,
    classNames,
    Counter,
    CustomSelectOptionInterface,
    FormItem,
    List,
    ModalPage,
    ModalPageHeader,
    Placeholder,
    PlatformProvider,
    Search,
    Select,
    SimpleCell,
    Spinner,
    Subhead,
    Tooltip
} from "@vkontakte/vkui";
import {useEffect, useMemo, useState} from "react";
import {
    Icon24Cancel,
    Icon24ListDeleteOutline,
    Icon24SearchSlashOutline,
    Icon24ViewOutline
} from "@vkontakte/icons";
import {ApiService} from "@/apiService/apiService";
import {GetOperationsResponse} from "@/apiService/apiGuide/types";
import {ProcessOperationSelectedItem} from "@/apiService/apiProcessOperations/types";
import {mergeState} from "@/shared/helpers";
import {useController, useSearch, useSelectFilter} from "@/shared/hooks";
import {useSnackbarStore} from "@/store/snackbar/snackbar";
import {OpenModalsType} from "@/components/modals/types";
import ModalOperationInfo from "@/components/modals/ModalGuide/ModalOperationInfo/ModalOperationInfo";
import {ModalManageProcessOperationsProps} from "@/components/modals/ModalProducts/ModalManageProcessOperations/types";
import styles from "./ModalManageProcessOperations.module.scss";

type SelectedOperationItem = Omit<ProcessOperationSelectedItem, "id"> & {
    id: number | null;
};

const ModalManageProcessOperations = (props: ModalManageProcessOperationsProps) => {

    const {
        processId,
        preventClose,
        onClose = () => {},
        ...restProps
    } = props;

    const addSnackbar = useSnackbarStore(state => state.addSnackbar);
    const selectFilter = useSelectFilter();
    const {createController: createOperationsController} = useController([]);
    const {createController: createSelectedController} = useController([]);
    const {createController: createGroupsController} = useController([]);

    const [operations, setOperations] = useState<GetOperationsResponse[]>([]);
    const [savedSelected, setSavedSelected] = useState<SelectedOperationItem[]>([]);
    const [selected, setSelected] = useState<SelectedOperationItem[]>([]);
    const [options, setOptions] = useState<Record<string, CustomSelectOptionInterface[]>>({
        operationGroup: [],
    });
    const [filters, setFilters] = useState({
        operationGroupId: 0,
    });
    const [loading, setLoading] = useState({
        operations: true,
        selected: true,
        operationGroup: true,
        send: false,
    });
    const [modals, setModals] = useState<OpenModalsType<"modal-operation-info">>({
        id: null,
        show: false,
        data: null,
    });

    const {
        search,
        setSearch,
        delaySearch,
        inputRef,
    } = useSearch(loading.operations);

    useEffect(() => {
        const groupsController = createGroupsController();

        ApiService.guide.operationGroup.get({
            controller: groupsController,
            options: {sorting: {id: "name", sort: "asc"}, forSelect: true},
        }).then(({status, data}) => {
            if (status === "success") {
                mergeState({
                    operationGroup: data.map(({id, name}) => ({
                        value: id,
                        label: name,
                    })),
                }, setOptions);
            } else onClose("error");
        }).finally(() => mergeState({operationGroup: false}, setLoading));
    }, []);

    useEffect(() => {
        mergeState({selected: true}, setLoading);
        const controller = createSelectedController();

        ApiService.processOperation.get({
            processId,
            controller,
        }).then(({status, data}) => {
            if (status === "success") {
                const nextSelected = data.map((operation) => ({...operation}));
                setSavedSelected(nextSelected);
                setSelected(nextSelected);
            } else onClose("error");
        }).finally(() => mergeState({selected: false}, setLoading));
    }, [processId]);

    useEffect(() => {
        mergeState({operations: true}, setLoading);
        const controller = createOperationsController();

        ApiService.guide.operation.get({
            controller,
            options: {
                search: delaySearch.trim() || undefined,
                operationGroupId: filters.operationGroupId || undefined,
                sorting: {id: "name", sort: "asc"},
                forSelect: true,
            },
        }).then(({status, data}) => {
            if (status === "success") {
                setOperations(data);
            }
        }).finally(() => mergeState({operations: false}, setLoading));
    }, [delaySearch, filters.operationGroupId]);

    const selectedOperationIds = useMemo(
        () => new Set(selected.map(({operationId}) => operationId)),
        [selected]
    );
    const availableOperations = useMemo(
        () => operations.filter(({id}) => !selectedOperationIds.has(id)),
        [operations, selectedOperationIds]
    );
    const selectedIds = useMemo(
        () => selected.map(({operationId}) => operationId).join(","),
        [selected]
    );
    const savedSelectedIds = useMemo(
        () => savedSelected.map(({operationId}) => operationId).join(","),
        [savedSelected]
    );
    const isLoading = loading.operations || loading.selected || loading.operationGroup;
    const hasFilter = !!delaySearch.trim() || filters.operationGroupId !== 0;
    const disabledSave = isLoading || loading.send || selectedIds === savedSelectedIds;

    const addOperation = (operation: GetOperationsResponse) => {
        if (loading.send) {
            return;
        }

        setSelected((prevState) => (
            prevState.some(({operationId}) => operationId === operation.id)
                ? prevState
                : [
                    ...prevState,
                    {
                        id: null,
                        operationId: operation.id,
                        name: operation.name,
                        operationGroup: operation.operationGroup?.name ?? "",
                        operationGroupId: operation.operationGroupId ?? operation.operationGroup?.id ?? 0,
                        sortOrder: prevState.length,
                    },
                ]
        ));
    };

    const removeOperation = (operationId: number) => {
        if (loading.send) {
            return;
        }

        setSelected((prevState) => prevState
            .filter((operation) => operation.operationId !== operationId)
            .map((operation, index) => ({...operation, sortOrder: index}))
        );
    };

    const reorderSelected = (fromIndex: number, toIndex: number) => {
        if (loading.send || fromIndex === toIndex) {
            return;
        }

        setSelected((prevState) => {
            const nextState = [...prevState];

            if (fromIndex < 0 || toIndex < 0 || fromIndex >= nextState.length || toIndex >= nextState.length) {
                return prevState;
            }

            const [removed] = nextState.splice(fromIndex, 1);
            nextState.splice(toIndex, 0, removed);

            return nextState.map((operation, index) => ({...operation, sortOrder: index}));
        });
    };

    const saveOperations = async () => {
        if (disabledSave) {
            return;
        }

        mergeState({send: true}, setLoading);

        try {
            const {status} = await ApiService.processOperation.putProcessOperations({
                processId,
                operationIds: selected.map(({operationId}) => operationId),
            });

            if (status === "success") {
                addSnackbar({
                    type: "success",
                    text: "Операции техпроцесса обновлены",
                });
                onClose("updated-data");
            }
        } finally {
            mergeState({send: false}, setLoading);
        }
    };

    return (
        <ModalPage
            className={styles.modal}
            height={640}
            hideCloseButton={loading.send}
            onClose={onClose}
            preventClose={preventClose || loading.send || modals.id !== null}
            header={(
                <>
                    <PlatformProvider value={"ios"}>
                        <ModalPageHeader>Управление операциями</ModalPageHeader>
                    </PlatformProvider>
                    <div className={styles.filters}>
                        <Search
                            value={search}
                            className={styles.filters__search}
                            onChange={e => setSearch(e.target.value)}
                            disabled={isLoading}
                            noPadding={true}
                            slotProps={{input: {getRootRef: inputRef}}}
                        />
                        <FormItem noPadding={true}>
                            <Select
                                filterFn={selectFilter.filterFn}
                                options={options.operationGroup}
                                searchable={true}
                                allowClearButton={true}
                                disabled={isLoading}
                                className={classNames(isLoading && "disabled")}
                                value={filters.operationGroupId}
                                onChange={(e) => mergeState({operationGroupId: Number(e.target.value)}, setFilters)}
                                placeholder={"Группа операций"}
                                onInputChange={selectFilter.onInputChange}
                                onOpen={selectFilter.onOpen}
                                onClose={selectFilter.onClose}
                            />
                        </FormItem>
                    </div>
                </>
            )}
            footer={(
                <div className={"modalFooter"}>
                    <ButtonGroup
                        stretched={true}
                        align={"right"}
                    >
                        <Button
                            size={"m"}
                            mode={"secondary"}
                            disabled={loading.send}
                            onClick={(e) => onClose("cancel", e)}
                        >
                            Отмена
                        </Button>
                        <Button
                            size={"m"}
                            loading={loading.send}
                            disabled={disabledSave}
                            onClick={saveOperations}
                        >
                            Сохранить
                        </Button>
                    </ButtonGroup>
                </div>
            )}
            {...restProps}
        >
            {"modal-operation-info" === modals.id && (
                <ModalOperationInfo
                    operationId={modals.data}
                    open={modals.show}
                    onClose={() => mergeState({show: false}, setModals)}
                    onClosed={() => setModals({id: null, show: false, data: null})}
                />
            )}
            <div className={styles.wrap}>
                <div className={styles.panel}>
                    <Subhead className={styles.panelHead}>Все операции</Subhead>
                    {loading.operations ? (
                        <Spinner size={"xl"} className={styles.spinner}/>
                    ) : availableOperations.length === 0 ? (
                        <Placeholder
                            stretched={true}
                            className={styles.empty}
                            icon={hasFilter
                                ? <Icon24SearchSlashOutline width={48} height={48}/>
                                : <Icon24ListDeleteOutline width={48} height={48}/>}
                        >
                            {hasFilter ? "Операции не найдены" : "Нет операций"}
                        </Placeholder>
                    ) : (
                        <div className={styles.list}>
                            {availableOperations.map((operation) => (
                                <SimpleCell
                                    key={operation.id}
                                    className={classNames(styles.cell, loading.send && 'disabled')}
                                    disabled={loading.send}
                                    multiline={true}
                                    subtitle={operation.operationGroup?.name}
                                    onClick={() => addOperation(operation)}
                                    after={(
                                        <Tooltip
                                            description={"Посмотреть"}
                                            usePortal={true}
                                            placement={"top"}
                                            disableTriggerOnFocus={true}
                                        >
                                            <Button
                                                rounded={true}
                                                size={"m"}
                                                mode={"tertiary"}
                                                before={<Icon24ViewOutline/>}
                                                onClick={(event) => {
                                                    event.stopPropagation();
                                                    setModals({
                                                        id: "modal-operation-info",
                                                        show: true,
                                                        data: operation.id,
                                                    });
                                                }}
                                            />
                                        </Tooltip>
                                    )}
                                >
                                    {operation.name}
                                </SimpleCell>
                            ))}
                        </div>
                    )}
                </div>
                <div className={styles.panel}>
                    <div className={styles.panelHead}>
                        <Subhead>Выбранные операции</Subhead>
                        <Counter size={"s"}>{selected.length}</Counter>
                    </div>
                    {loading.selected ? (
                        <Spinner size={"xl"} className={styles.spinner}/>
                    ) : selected.length === 0 ? (
                        <Placeholder
                            stretched={true}
                            className={styles.empty}
                            icon={<Icon24ListDeleteOutline width={48} height={48}/>}
                        >
                            Нет выбранных операций
                        </Placeholder>
                    ) : (
                        <List className={styles.list} gap={8}>
                            {selected.map((operation) => (
                                <Cell
                                    key={operation.operationId}
                                    className={classNames(styles.cell, loading.send && 'disabled')}
                                    disabled={loading.send}
                                    draggable={selected.length > 1}
                                    onDragFinish={({from, to}) => reorderSelected(from, to)}
                                    multiline={true}
                                    subtitle={operation.operationGroup}
                                    after={(
                                        <ButtonGroup
                                            gap={"none"}
                                            className={styles.cell__buttons}
                                        >
                                            <Tooltip
                                                description={"Посмотреть"}
                                                usePortal={true}
                                                placement={"top"}
                                                disableTriggerOnFocus={true}
                                            >
                                                <Button
                                                    type={"button"}
                                                    size={"m"}
                                                    mode={"tertiary"}
                                                    rounded={true}
                                                    before={<Icon24ViewOutline/>}
                                                    onClick={() => setModals({
                                                        id: "modal-operation-info",
                                                        show: true,
                                                        data: operation.operationId,
                                                    })}
                                                />
                                            </Tooltip>
                                            <Tooltip
                                                description={"Удалить"}
                                                usePortal={true}
                                                placement={"top"}
                                                disableTriggerOnFocus={true}
                                            >
                                                <Button
                                                    type={"button"}
                                                    size={"m"}
                                                    mode={"tertiary"}
                                                    rounded={true}
                                                    disabled={loading.send}
                                                    before={<Icon24Cancel/>}
                                                    onClick={() => removeOperation(operation.operationId)}
                                                />
                                            </Tooltip>
                                        </ButtonGroup>
                                    )}
                                >
                                    {operation.name}
                                </Cell>
                            ))}
                        </List>
                    )}
                </div>
            </div>
        </ModalPage>
    );
};

export default ModalManageProcessOperations;
