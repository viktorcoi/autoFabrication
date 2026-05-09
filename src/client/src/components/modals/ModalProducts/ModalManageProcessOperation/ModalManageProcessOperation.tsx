import {
    Button,
    ButtonGroup,
    FormItem,
    ModalPage,
    ModalPageHeader,
    PlatformProvider,
    Spinner,
    Textarea
} from "@vkontakte/vkui";
import {SubmitEvent, useEffect, useMemo, useState} from "react";
import {ApiService} from "@/apiService/apiService";
import {
    PatchProcessOperationOptions,
    ProcessOperationFileItem
} from "@/apiService/apiProcessOperations/types";
import {useController} from "@/shared/hooks";
import {mergeState} from "@/shared/helpers";
import {useSnackbarStore} from "@/store/snackbar/snackbar";
import NumberPicker from "@/components/NumberPicker/NumberPicker";
import UploadFile from "@/components/UploadFile/UploadFile";
import {ModalManageProcessOperationProps} from "@/components/modals/ModalProducts/ModalManageProcessOperation/types";
import styles from "./ModalManageProcessOperation.module.scss";

type ManageProcessOperationData = {
    name: string;
    exit: number;
    description: string;
    files: File[];
    existingFiles: ProcessOperationFileItem[];
    locked: boolean;
};

const initialData: ManageProcessOperationData = {
    name: "",
    exit: 0,
    description: "",
    files: [],
    existingFiles: [],
    locked: false,
};

const getFileIds = (files: ProcessOperationFileItem[]) => files.map((file) => file.id).sort((a, b) => a - b);

const ModalManageProcessOperation = (props: ModalManageProcessOperationProps) => {

    const {
        idProcessOperation,
        preventClose,
        onClose = () => {},
        ...restProps
    } = props;

    const addSnackbar = useSnackbarStore(state => state.addSnackbar);
    const {createController} = useController([idProcessOperation]);

    const [savedData, setSavedData] = useState<ManageProcessOperationData>({...initialData});
    const [data, setData] = useState<ManageProcessOperationData>({...initialData});
    const [loading, setLoading] = useState({
        get: true,
        send: false,
    });

    useEffect(() => {
        mergeState({get: true}, setLoading);
        const controller = createController();

        ApiService.processOperation.getById({
            id: idProcessOperation,
            controller,
        }).then(({status, data}) => {
            if (status === "success") {
                const init: ManageProcessOperationData = {
                    name: data.operation.name,
                    exit: data.exit ?? 0,
                    description: data.description ?? "",
                    files: [],
                    existingFiles: data.files,
                    locked: data.process.disabledById !== null,
                };

                setSavedData(init);
                setData(init);
            } else onClose("error");
        }).finally(() => mergeState({get: false}, setLoading));
    }, [idProcessOperation]);

    const removedFileIds = useMemo(
        () => getFileIds(savedData.existingFiles).filter((fileId) => !getFileIds(data.existingFiles).includes(fileId)),
        [data.existingFiles, savedData.existingFiles]
    );
    const editDisabled = data.locked || loading.send;
    const disabledSave = useMemo(() => {
        if (editDisabled) {
            return true;
        }

        return data.exit === savedData.exit
            && data.description.trim() === savedData.description.trim()
            && data.files.length === 0
            && removedFileIds.length === 0;
    }, [data, editDisabled, removedFileIds, savedData]);

    const saveOperation = async (event: SubmitEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (disabledSave || loading.send) return;

        mergeState({send: true}, setLoading);

        try {
            const options: PatchProcessOperationOptions = {};

            if (data.exit !== savedData.exit) {
                options.exit = data.exit || null;
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

            const {status} = await ApiService.processOperation.patch({
                id: idProcessOperation,
                options,
            });

            if (status === "success") {
                addSnackbar({
                    type: "success",
                    text: `Операция "${data.name}" обновлена`,
                });
                onClose("updated-data");
            }
        } finally {
            mergeState({send: false}, setLoading);
        }
    };

    return (
        <ModalPage
            hideCloseButton={loading.send}
            onClose={onClose}
            preventClose={preventClose || loading.send}
            header={(
                <PlatformProvider value={"ios"}>
                    <ModalPageHeader>{data.name ? `Редактирование: ${data.name}` : "Редактирование операции"}</ModalPageHeader>
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
                            form={"save-process-operation"}
                            type={"submit"}
                            disabled={disabledSave || loading.get}
                            loading={loading.send}
                            size={"m"}
                        >
                            Сохранить
                        </Button>
                    </ButtonGroup>
                </div>
            )}
            {...restProps}
        >
            {loading.get ? <Spinner size={"xl"} className={styles.plug}/> : (
                <form id={"save-process-operation"} className={"modalForm"} onSubmit={saveOperation}>
                    <FormItem
                        top={"Кол-во изделий на выходе"}
                        noPadding={true}
                    >
                        <NumberPicker
                            min={0}
                            max={1_000_000}
                            step={1}
                            value={data.exit}
                            disabled={editDisabled}
                            onChange={(exit) => mergeState({exit}, setData)}
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

export default ModalManageProcessOperation;
