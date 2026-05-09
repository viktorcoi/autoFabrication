import {
    Button,
    ButtonGroup,
    FormItem,
    Input,
    ModalPage,
    ModalPageHeader,
    PlatformProvider,
    Spinner,
    Textarea
} from "@vkontakte/vkui";
import {SubmitEvent, useEffect, useMemo, useState} from "react";
import {ApiService} from "@/apiService/apiService";
import {
    PatchProcessStepOptions,
    ProcessStepFileItem,
} from "@/apiService/apiProcessSteps/types";
import {useController} from "@/shared/hooks";
import {mergeState} from "@/shared/helpers";
import {useSnackbarStore} from "@/store/snackbar/snackbar";
import UploadFile from "@/components/UploadFile/UploadFile";
import {ModalManageProcessStepProps} from "@/components/modals/ModalProducts/ModalManageProcessStep/types";
import styles from "./ModalManageProcessStep.module.scss";

type ManageProcessStepData = {
    id: number | null;
    clientId: string;
    name: string;
    description: string;
    files: File[];
    existingFiles: ProcessStepFileItem[];
    removedFileIds: number[];
    locked: boolean;
};

const createClientId = () => `new-${Date.now()}-${Math.random().toString(16).slice(2)}`;

const initialData: ManageProcessStepData = {
    id: null,
    clientId: createClientId(),
    name: "",
    description: "",
    files: [],
    existingFiles: [],
    removedFileIds: [],
    locked: false,
};

const getFileIds = (files: ProcessStepFileItem[]) => files.map((file) => file.id).sort((a, b) => a - b);

const uniqueIds = (ids: number[]) => Array.from(new Set(ids));

const ModalManageProcessStep = (props: ModalManageProcessStepProps) => {

    const {
        idStep = null,
        step = null,
        preventClose,
        onApplyStep,
        onClose = () => {},
        ...restProps
    } = props;

    const addSnackbar = useSnackbarStore(state => state.addSnackbar);
    const {createController} = useController([idStep]);
    const isPersistedMode = typeof idStep === "number" && idStep > 0;

    const [savedData, setSavedData] = useState<ManageProcessStepData>({...initialData, clientId: createClientId()});
    const [data, setData] = useState<ManageProcessStepData>({...initialData, clientId: createClientId()});
    const [loading, setLoading] = useState({
        get: isPersistedMode,
        send: false,
    });

    useEffect(() => {
        if (!isPersistedMode) {
            const init: ManageProcessStepData = step
                ? {
                    id: step.id,
                    clientId: step.clientId,
                    name: step.name,
                    description: step.description,
                    files: step.files,
                    existingFiles: step.existingFiles,
                    removedFileIds: step.removedFileIds ?? [],
                    locked: false,
                }
                : {
                    ...initialData,
                    clientId: createClientId(),
                };

            setSavedData(init);
            setData(init);
            mergeState({get: false}, setLoading);
            return;
        }

        mergeState({get: true}, setLoading);
        const controller = createController();

        ApiService.processStep.getById({
            id: idStep,
            controller,
        }).then(({status, data}) => {
            if (status === "success") {
                const init: ManageProcessStepData = {
                    id: data.id,
                    clientId: `step-${data.id}`,
                    name: data.name,
                    description: data.description ?? "",
                    files: [],
                    existingFiles: data.files,
                    removedFileIds: [],
                    locked: data.processOperation.process.disabledById !== null,
                };

                setSavedData(init);
                setData(init);
            } else onClose("error");
        }).finally(() => mergeState({get: false}, setLoading));
    }, [idStep, isPersistedMode, step]);

    const removedFileIds = useMemo(
        () => uniqueIds([
            ...savedData.removedFileIds,
            ...getFileIds(savedData.existingFiles).filter((fileId) => !getFileIds(data.existingFiles).includes(fileId)),
        ]),
        [data.existingFiles, savedData.existingFiles, savedData.removedFileIds]
    );
    const editDisabled = data.locked || loading.send;
    const disabledSave = useMemo(() => {
        const validRequired = !!data.name.trim();

        if (editDisabled || !validRequired) {
            return true;
        }

        return data.name.trim() === savedData.name.trim()
            && data.description.trim() === savedData.description.trim()
            && data.files.length === savedData.files.length
            && data.files.every((file, index) => file === savedData.files[index])
            && removedFileIds.join(",") === savedData.removedFileIds.join(",");
    }, [data, editDisabled, removedFileIds, savedData]);

    const saveStep = async (event: SubmitEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (disabledSave || loading.send) return;

        if (!isPersistedMode) {
            onApplyStep?.({
                id: data.id,
                clientId: data.clientId,
                name: data.name.trim(),
                description: data.description.trim(),
                files: data.files,
                existingFiles: data.existingFiles,
                removedFileIds,
            });
            onClose("updated-data");
            return;
        }

        mergeState({send: true}, setLoading);

        try {
            const options: PatchProcessStepOptions = {};

            if (data.name.trim() !== savedData.name.trim()) {
                options.name = data.name.trim();
            }

            if (data.description.trim() !== savedData.description.trim()) {
                options.description = data.description.trim();
            }

            if (removedFileIds.length) {
                options.removedFileIds = removedFileIds;
            }

            if (data.files.length) {
                options.files = data.files;
            }

            const {status} = await ApiService.processStep.patch({
                id: idStep,
                options,
            });

            if (status === "success") {
                addSnackbar({
                    type: "success",
                    text: `Этап "${data.name.trim()}" обновлен`,
                });
                onClose("updated-data");
            }
        } finally {
            mergeState({send: false}, setLoading);
        }
    };

    const title = data.id === null && !isPersistedMode ? "Добавление этапа" : "Редактирование этапа";

    return (
        <ModalPage
            hideCloseButton={loading.send}
            onClose={onClose}
            preventClose={preventClose || loading.send}
            header={(
                <PlatformProvider value={"ios"}>
                    <ModalPageHeader>{title}</ModalPageHeader>
                </PlatformProvider>
            )}
            footer={(
                <div className={"modalFooter"}>
                    <ButtonGroup
                        stretched={true}
                        align={"right"}
                    >
                        <Button
                            disabled={loading.send}
                            size={"m"}
                            mode={"secondary"}
                            onClick={(e) => onClose("cancel", e)}
                        >
                            Отмена
                        </Button>
                        <Button
                            form={"save-process-step"}
                            type={"submit"}
                            disabled={disabledSave || loading.get}
                            loading={loading.send}
                            size={"m"}
                        >
                            {!isPersistedMode ? 'Применить' : 'Сохранить'}
                        </Button>
                    </ButtonGroup>
                </div>
            )}
            {...restProps}
        >
            {loading.get ? <Spinner size={"xl"} className={styles.plug}/> : (
                <form id={"save-process-step"} className={"modalForm"} onSubmit={saveStep}>
                    <FormItem
                        top={"Название"}
                        noPadding={true}
                    >
                        <Input
                            maxLength={50}
                            disabled={editDisabled}
                            value={data.name}
                            onChange={(e) => mergeState({name: e.target.value}, setData)}
                            placeholder={"Введите название"}
                            status={!data.name.trim() ? "error" : "default"}
                        />
                    </FormItem>
                    <FormItem
                        top={"Файлы"}
                        noPadding={true}
                    >
                        <UploadFile
                            value={data.files}
                            savedFiles={data.existingFiles}
                            disabled={editDisabled}
                            maxFiles={20}
                            maxSize={100}
                            accept={[".zip", ".rar", ".7zip", "image/png", "image/jpeg", "image/webp", "image/gif", "image/bmp", ".docx", ".doc", ".dotx", ".xls", ".xlsx", ".ppt", ".pptx", ".pdf"]}
                            maxTotalSize={200}
                            onChange={(files) => mergeState({files}, setData)}
                            onRemoveSavedFile={(file) => mergeState({
                                existingFiles: data.existingFiles.filter((item) => item.id !== file.id)
                            }, setData)}
                            onError={(error) => addSnackbar({
                                type: "error",
                                text: error.message,
                            })}
                        />
                    </FormItem>
                    <FormItem
                        className={"count-symbols"}
                        top={"Описание"}
                        noPadding={true}
                        bottom={`${data.description.length} из 255`}
                    >
                        <Textarea
                            disabled={editDisabled}
                            value={data.description}
                            onChange={(e) => mergeState({description: e.target.value}, setData)}
                            className={styles.textarea}
                            placeholder={"Введите описание"}
                            maxLength={255}
                        />
                    </FormItem>
                </form>
            )}
        </ModalPage>
    );
};

export default ModalManageProcessStep;
