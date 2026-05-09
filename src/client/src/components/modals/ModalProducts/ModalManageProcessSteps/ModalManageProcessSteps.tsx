import {
    Button,
    ButtonGroup,
    Cell, classNames,
    Counter,
    List,
    ModalPage,
    ModalPageHeader,
    Placeholder,
    PlatformProvider,
    Spinner,
    Subhead,
    Tooltip
} from "@vkontakte/vkui";
import {useEffect, useMemo, useState} from "react";
import {
    Icon24Add,
    Icon24Cancel,
    Icon24ListDeleteOutline,
    Icon24PenOutline
} from "@vkontakte/icons";
import {ApiService} from "@/apiService/apiService";
import {ProcessStepFormItem} from "@/apiService/apiProcessSteps/types";
import {mergeState} from "@/shared/helpers";
import {useController} from "@/shared/hooks";
import {useSnackbarStore} from "@/store/snackbar/snackbar";
import {OpenModalsType} from "@/components/modals/types";
import ModalManageProcessStep from "@/components/modals/ModalProducts/ModalManageProcessStep/ModalManageProcessStep";
import {ModalManageProcessStepsProps} from "@/components/modals/ModalProducts/ModalManageProcessSteps/types";
import styles from "./ModalManageProcessSteps.module.scss";

const ModalManageProcessSteps = (props: ModalManageProcessStepsProps) => {

    const {
        operationId,
        disabled = false,
        preventClose,
        onClose = () => {},
        ...restProps
    } = props;

    const addSnackbar = useSnackbarStore(state => state.addSnackbar);
    const {createController} = useController([operationId]);

    const [savedSteps, setSavedSteps] = useState<ProcessStepFormItem[]>([]);
    const [steps, setSteps] = useState<ProcessStepFormItem[]>([]);
    const [loading, setLoading] = useState({
        get: true,
        send: false,
    });
    const [modals, setModals] = useState<OpenModalsType<"modal-manage-step">>({
        id: null,
        show: false,
        data: null,
    });

    useEffect(() => {
        mergeState({get: true}, setLoading);
        const controller = createController();

        ApiService.processStep.get({
            operationId,
            controller,
        }).then(({status, data}) => {
            if (status === "success") {
                const initSteps: ProcessStepFormItem[] = data.map((step) => ({
                    id: step.id,
                    clientId: step.clientId,
                    name: step.name,
                    description: step.description,
                    files: [],
                    existingFiles: step.files,
                    removedFileIds: [],
                }));

                setSavedSteps(initSteps);
                setSteps(initSteps);
            } else onClose("error");
        }).finally(() => mergeState({get: false}, setLoading));
    }, [operationId]);

    const savedStateKey = useMemo(
        () => JSON.stringify(savedSteps.map((step) => ({
            id: step.id,
            clientId: step.clientId,
            name: step.name,
            description: step.description,
            unsavedFiles: step.files.map((file) => `${file.name}:${file.size}:${file.lastModified}`),
            files: step.existingFiles.map((file) => file.id),
            removedFileIds: step.removedFileIds ?? [],
        }))),
        [savedSteps]
    );
    const stateKey = useMemo(
        () => JSON.stringify(steps.map((step) => ({
            id: step.id,
            clientId: step.clientId,
            name: step.name,
            description: step.description,
            unsavedFiles: step.files.map((file) => `${file.name}:${file.size}:${file.lastModified}`),
            files: step.existingFiles.map((file) => file.id),
            removedFileIds: step.removedFileIds ?? [],
        }))),
        [steps]
    );
    const disabledActions = disabled || loading.send;
    const disabledSave = disabled || loading.get || loading.send || savedStateKey === stateKey;

    const applyStep = (step: ProcessStepFormItem) => {
        setSteps((prevState) => {
            const index = prevState.findIndex((item) => item.clientId === step.clientId);

            if (index === -1) {
                return [...prevState, step];
            }

            const nextState = [...prevState];
            nextState[index] = step;

            return nextState;
        });
    };

    const removeStep = (clientId: string) => {
        if (disabledActions) {
            return;
        }

        setSteps((prevState) => prevState.filter((step) => step.clientId !== clientId));
    };

    const reorderSteps = (fromIndex: number, toIndex: number) => {
        if (disabledActions || fromIndex === toIndex) {
            return;
        }

        setSteps((prevState) => {
            const nextState = [...prevState];

            if (fromIndex < 0 || toIndex < 0 || fromIndex >= nextState.length || toIndex >= nextState.length) {
                return prevState;
            }

            const [removed] = nextState.splice(fromIndex, 1);
            nextState.splice(toIndex, 0, removed);

            return nextState;
        });
    };

    const saveSteps = async () => {
        if (disabledSave) {
            return;
        }

        mergeState({send: true}, setLoading);

        try {
            const {status} = await ApiService.processStep.putProcessSteps({
                operationId,
                options: {items: steps},
            });

            if (status === "success") {
                addSnackbar({
                    type: "success",
                    text: "Этапы обновлены",
                });
                onClose("updated-data");
            }
        } finally {
            mergeState({send: false}, setLoading);
        }
    };

    return (
        <ModalPage
            height={620}
            hideCloseButton={loading.send}
            onClose={onClose}
            preventClose={preventClose || loading.send || modals.id !== null}
            header={(
                <PlatformProvider value={"ios"}>
                    <ModalPageHeader
                        after={(
                            <Tooltip
                                description={"Добавить"}
                                usePortal={true}
                                placement={"top"}
                                disableTriggerOnFocus={true}
                            >
                                <Button
                                    mode={"secondary"}
                                    size={"m"}
                                    disabled={loading.get || disabledActions}
                                    before={<Icon24Add/>}
                                    onClick={() => setModals({
                                        id: "modal-manage-step",
                                        show: true,
                                        data: null,
                                    })}
                                />
                            </Tooltip>
                        )}
                    >
                        Управление этапами
                    </ModalPageHeader>
                </PlatformProvider>
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
                            onClick={saveSteps}
                        >
                            Сохранить
                        </Button>
                    </ButtonGroup>
                </div>
            )}
            {...restProps}
        >
            {"modal-manage-step" === modals.id && (
                <ModalManageProcessStep
                    step={modals.data}
                    open={modals.show}
                    onApplyStep={applyStep}
                    onClose={() => mergeState({show: false}, setModals)}
                    onClosed={() => setModals({id: null, show: false, data: null})}
                />
            )}
            {loading.get ? (
                <Spinner size={"xl"} className={styles.spinner}/>
            ) : steps.length === 0 ? (
                <Placeholder
                    stretched={true}
                    icon={<Icon24ListDeleteOutline width={48} height={48}/>}
                >
                    Нет добавленных этапов
                </Placeholder>
            ) : (
                <List className={styles.list} gap={8}>
                    {steps.map((step) => (
                        <Cell
                            key={step.clientId}
                            className={classNames(styles.cell, disabledActions && 'disabled')}
                            draggable={steps.length > 1}
                            onDragFinish={({from, to}) => reorderSteps(from, to)}
                            multiline={true}
                            subtitle={step.description}
                            after={(
                                <ButtonGroup
                                    gap={"none"}
                                    className={styles.cell__buttons}
                                >
                                    <Tooltip
                                        description={"Редактировать"}
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
                                            before={<Icon24PenOutline/>}
                                            onClick={() => setModals({
                                                id: "modal-manage-step",
                                                show: true,
                                                data: step,
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
                                            disabled={disabledActions}
                                            before={<Icon24Cancel/>}
                                            onClick={() => removeStep(step.clientId)}
                                        />
                                    </Tooltip>
                                </ButtonGroup>
                            )}
                        >
                            {step.name}
                        </Cell>
                    ))}
                </List>
            )}
        </ModalPage>
    );
};

export default ModalManageProcessSteps;
