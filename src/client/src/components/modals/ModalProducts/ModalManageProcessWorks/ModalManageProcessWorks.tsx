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
import {GetWorksResponse} from "@/apiService/apiGuide/types";
import {ProcessWorkSelectedItem} from "@/apiService/apiProcessWorks/types";
import {mergeState} from "@/shared/helpers";
import {useController, useSearch, useSelectFilter} from "@/shared/hooks";
import {useSnackbarStore} from "@/store/snackbar/snackbar";
import NumberPicker from "@/components/NumberPicker/NumberPicker";
import {OpenModalsType} from "@/components/modals/types";
import ModalWorkInfo from "@/components/modals/ModalGuide/ModalWorkInfo/ModalWorkInfo";
import {ModalManageProcessWorksProps} from "@/components/modals/ModalProducts/ModalManageProcessWorks/types";
import styles from "./ModalManageProcessWorks.module.scss";

type SelectedWorkItem = Omit<ProcessWorkSelectedItem, "id"> & {
    id: number | null;
};

const ModalManageProcessWorks = (props: ModalManageProcessWorksProps) => {

    const {
        stepId,
        operationId,
        disabled = false,
        preventClose,
        onClose = () => {},
        ...restProps
    } = props;

    const addSnackbar = useSnackbarStore(state => state.addSnackbar);
    const selectFilter = useSelectFilter();
    const {createController: createWorksController} = useController([]);
    const {createController: createSelectedController} = useController([]);
    const {createController: createGroupsController} = useController([]);

    const [works, setWorks] = useState<GetWorksResponse[]>([]);
    const [savedSelected, setSavedSelected] = useState<SelectedWorkItem[]>([]);
    const [selected, setSelected] = useState<SelectedWorkItem[]>([]);
    const [options, setOptions] = useState<Record<string, CustomSelectOptionInterface[]>>({
        workGroup: [],
    });
    const [filters, setFilters] = useState({
        workGroupId: 0,
    });
    const [loading, setLoading] = useState({
        works: true,
        selected: true,
        workGroup: true,
        send: false,
    });
    const [modals, setModals] = useState<OpenModalsType<"modal-work-info">>({
        id: null,
        show: false,
        data: null,
    });

    const {
        search,
        setSearch,
        delaySearch,
        inputRef,
    } = useSearch(loading.works);

    useEffect(() => {
        const groupsController = createGroupsController();

        ApiService.guide.workGroup.get({
            controller: groupsController,
            options: {operationId, sorting: {id: "name", sort: "asc"}, forSelect: true},
        }).then(({status, data}) => {
            if (status === "success") {
                mergeState({
                    workGroup: data.map(({id, name}) => ({
                        value: id,
                        label: name,
                    })),
                }, setOptions);
            } else onClose("error");
        }).finally(() => mergeState({workGroup: false}, setLoading));
    }, [operationId]);

    useEffect(() => {
        mergeState({selected: true}, setLoading);
        const controller = createSelectedController();

        ApiService.processWork.get({
            stepId,
            controller,
        }).then(({status, data}) => {
            if (status === "success") {
                const nextSelected = data.map((work) => ({...work}));
                setSavedSelected(nextSelected);
                setSelected(nextSelected);
            } else onClose("error");
        }).finally(() => mergeState({selected: false}, setLoading));
    }, [stepId]);

    useEffect(() => {
        mergeState({works: true}, setLoading);
        const controller = createWorksController();

        ApiService.guide.work.get({
            controller,
            options: {
                search: delaySearch.trim() || undefined,
                operationId,
                workGroupId: filters.workGroupId || undefined,
                sorting: {id: "name", sort: "asc"},
                forSelect: true,
            },
        }).then(({status, data}) => {
            if (status === "success") {
                setWorks(data);
            }
        }).finally(() => mergeState({works: false}, setLoading));
    }, [delaySearch, filters.workGroupId, operationId]);

    const selectedWorkIds = useMemo(
        () => new Set(selected.map(({workId}) => workId)),
        [selected]
    );
    const availableWorks = useMemo(
        () => works.filter(({id}) => !selectedWorkIds.has(id)),
        [works, selectedWorkIds]
    );
    const selectedStateKey = useMemo(
        () => JSON.stringify(selected.map(({workId, count}) => ({workId, count}))),
        [selected]
    );
    const savedSelectedStateKey = useMemo(
        () => JSON.stringify(savedSelected.map(({workId, count}) => ({workId, count}))),
        [savedSelected]
    );
    const isLoading = loading.works || loading.selected || loading.workGroup;
    const hasFilter = !!delaySearch.trim() || filters.workGroupId !== 0;
    const disabledActions = disabled || loading.send;
    const disabledSave = disabled || isLoading || loading.send || selectedStateKey === savedSelectedStateKey;

    const addWork = (work: GetWorksResponse) => {
        if (disabledActions) {
            return;
        }

        setSelected((prevState) => (
            prevState.some(({workId}) => workId === work.id)
                ? prevState
                : [
                    ...prevState,
                    {
                        id: null,
                        workId: work.id,
                        name: work.name,
                        workGroup: work.workGroup?.name ?? "",
                        workGroupId: work.workGroupId ?? work.workGroup?.id ?? 0,
                        sortOrder: prevState.length,
                        count: 1,
                        tpz: work.tpz,
                        tsht: work.tsht,
                    },
                ]
        ));
    };

    const removeWork = (workId: number) => {
        if (disabledActions) {
            return;
        }

        setSelected((prevState) => prevState
            .filter((work) => work.workId !== workId)
            .map((work, index) => ({...work, sortOrder: index}))
        );
    };

    const updateWorkCount = (workId: number, count: number) => {
        if (disabledActions) {
            return;
        }

        setSelected((prevState) => prevState.map((work) => (
            work.workId === workId ? {...work, count} : work
        )));
    };

    const reorderSelected = (fromIndex: number, toIndex: number) => {
        if (disabledActions || fromIndex === toIndex) {
            return;
        }

        setSelected((prevState) => {
            const nextState = [...prevState];

            if (fromIndex < 0 || toIndex < 0 || fromIndex >= nextState.length || toIndex >= nextState.length) {
                return prevState;
            }

            const [removed] = nextState.splice(fromIndex, 1);
            nextState.splice(toIndex, 0, removed);

            return nextState.map((work, index) => ({...work, sortOrder: index}));
        });
    };

    const saveWorks = async () => {
        if (disabledSave) {
            return;
        }

        mergeState({send: true}, setLoading);

        try {
            const {status} = await ApiService.processWork.putProcessWorks({
                stepId,
                options: {
                    items: selected.map(({id, workId, count}) => ({id, workId, count})),
                },
            });

            if (status === "success") {
                addSnackbar({
                    type: "success",
                    text: "Работы этапа обновлены",
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
                        <ModalPageHeader>Управление работами</ModalPageHeader>
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
                                options={options.workGroup}
                                searchable={true}
                                allowClearButton={true}
                                disabled={isLoading}
                                className={classNames(isLoading && "disabled")}
                                value={filters.workGroupId}
                                onChange={(e) => mergeState({workGroupId: Number(e.target.value)}, setFilters)}
                                placeholder={"Группа работ"}
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
                            onClick={saveWorks}
                        >
                            Сохранить
                        </Button>
                    </ButtonGroup>
                </div>
            )}
            {...restProps}
        >
            {"modal-work-info" === modals.id && (
                <ModalWorkInfo
                    workId={modals.data}
                    open={modals.show}
                    onClose={() => mergeState({show: false}, setModals)}
                    onClosed={() => setModals({id: null, show: false, data: null})}
                />
            )}
            <div className={styles.wrap}>
                <div className={styles.panel}>
                    <Subhead className={styles.panelHead}>Все работы</Subhead>
                    {loading.works ? (
                        <Spinner size={"xl"} className={styles.spinner}/>
                    ) : availableWorks.length === 0 ? (
                        <Placeholder
                            stretched={true}
                            className={styles.empty}
                            icon={hasFilter
                                ? <Icon24SearchSlashOutline width={48} height={48}/>
                                : <Icon24ListDeleteOutline width={48} height={48}/>}
                        >
                            {hasFilter ? "Работы не найдены" : "Нет работ"}
                        </Placeholder>
                    ) : (
                        <div className={styles.list}>
                            {availableWorks.map((work) => (
                                <SimpleCell
                                    key={work.id}
                                    className={classNames(styles.cell, disabledActions && "disabled")}
                                    disabled={disabledActions}
                                    multiline={true}
                                    subtitle={work.workGroup?.name}
                                    onClick={() => addWork(work)}
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
                                                        id: "modal-work-info",
                                                        show: true,
                                                        data: work.id,
                                                    });
                                                }}
                                            />
                                        </Tooltip>
                                    )}
                                >
                                    {work.name}
                                </SimpleCell>
                            ))}
                        </div>
                    )}
                </div>
                <div className={styles.panel}>
                    <div className={styles.panelHead}>
                        <Subhead>Выбранные работы</Subhead>
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
                            Нет выбранных работ
                        </Placeholder>
                    ) : (
                        <List className={styles.list} gap={8}>
                            {selected.map((work) => (
                                <Cell
                                    key={work.workId}
                                    className={classNames(styles.cell, disabledActions && "disabled")}
                                    disabled={disabledActions}
                                    draggable={selected.length > 1}
                                    onDragFinish={({from, to}) => reorderSelected(from, to)}
                                    multiline={true}
                                    subtitle={work.workGroup}
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
                                                        id: "modal-work-info",
                                                        show: true,
                                                        data: work.workId,
                                                    })}
                                                />
                                            </Tooltip>
                                            <div
                                                className={styles.countPicker}
                                                onPointerDown={(event) => event.stopPropagation()}
                                                onClick={(event) => event.stopPropagation()}
                                            >
                                                <NumberPicker
                                                    min={1}
                                                    max={1_000}
                                                    step={1}
                                                    value={work.count}
                                                    disabled={disabledActions}
                                                    onChange={(count) => updateWorkCount(work.workId, count)}
                                                />
                                            </div>
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
                                                    disabled={disabledActions}
                                                    before={<Icon24Cancel/>}
                                                    onClick={() => removeWork(work.workId)}
                                                />
                                            </Tooltip>
                                        </ButtonGroup>
                                    )}
                                >
                                    {work.name}
                                </Cell>
                            ))}
                        </List>
                    )}
                </div>
            </div>
        </ModalPage>
    );
};

export default ModalManageProcessWorks;
