import {
    Button,
    ButtonGroup,
    CustomSelectOptionInterface,
    FormItem,
    Input,
    ModalPage,
    ModalPageHeader,
    PlatformProvider,
    Select,
    Spinner,
    Textarea
} from "@vkontakte/vkui";
import {SubmitEvent, useEffect, useMemo, useState} from "react";
import {ApiService} from "@/apiService/apiService";
import {useSnackbarStore} from "@/store/snackbar/snackbar";
import {useController, useSelectFilter} from "@/shared/hooks";
import {mergeState} from "@/shared/helpers";
import UploadFile from "@/components/UploadFile/UploadFile";
import {PathProcessOptions, ProcessFileItem} from "@/apiService/apiProcesses/types";
import {ModalManageProcessProps} from "@/components/modals/ModalProducts/ModalManageProcess/types";
import styles from "./ModalManageProcess.module.scss";

type ManageProcessData = {
    blankId: number;
    name: string;
    description: string;
    files: File[];
    existingFiles: ProcessFileItem[];
    locked: boolean;
};

const initialData: ManageProcessData = {
    blankId: 0,
    name: "",
    description: "",
    files: [],
    existingFiles: [],
    locked: false,
};

const getFileIds = (files: ProcessFileItem[]) => files.map((file) => file.id).sort((a, b) => a - b);

const ModalManageProcess = (props: ModalManageProcessProps) => {

    const {
        idProcess,
        productId,
        productMaterialId,
        preventClose,
        onClose = () => {},
        ...restProps
    } = props;

    const addSnackbar = useSnackbarStore(state => state.addSnackbar);
    const selectFilter = useSelectFilter();
    const {createController} = useController([]);

    const [savedData, setSavedData] = useState<ManageProcessData>({...initialData});
    const [data, setData] = useState<ManageProcessData>({...initialData});
    const [blanks, setBlanks] = useState<CustomSelectOptionInterface[]>([]);
    const [loading, setLoading] = useState({
        get: true,
        send: false,
    });

    useEffect(() => {
        const controller = createController();

        const loadData = async () => {
            if (productMaterialId) {
                await ApiService.guide.blank.get({
                    options: {
                        materialId: productMaterialId,
                        sorting: {id: "name", sort: "asc"},
                    },
                    controller,
                }).then(({status, data}) => {
                    if (status === 'success') {
                        setBlanks(data.map(({id, name}) => ({
                            value: id,
                            label: name,
                        })));
                    } else onClose("error");
                });
            }

            if (idProcess !== null) {
                await ApiService.process.getById({
                    id: idProcess,
                    controller,
                }).then(({status, data}) => {
                    if (status === 'success') {
                        const init: ManageProcessData = {
                            blankId: data.blankId ?? 0,
                            name: data.name,
                            description: data.description ?? "",
                            files: [],
                            existingFiles: data.files,
                            locked: !data.access,
                        };

                        setSavedData(init);
                        setData(init);
                    } else onClose("error");
                });
            }
        };

        loadData().finally(() => mergeState({get: false}, setLoading));
    }, [idProcess, productId, productMaterialId]);

    const removedFileIds = useMemo(
        () => getFileIds(savedData.existingFiles).filter((fileId) => !getFileIds(data.existingFiles).includes(fileId)),
        [data.existingFiles, savedData.existingFiles]
    );

    const disabledSave = useMemo(() => {
        const validRequired = !!data.name.trim();
        const validEdit = validRequired && (
            data.blankId !== savedData.blankId ||
            data.name.trim() !== savedData.name.trim() ||
            data.description.trim() !== savedData.description.trim() ||
            data.files.length > 0 ||
            removedFileIds.length > 0
        );

        if (data.locked) {
            return true;
        }

        return idProcess === null ? !validRequired : !validEdit;
    }, [idProcess, data, savedData, removedFileIds]);

    const saveProcess = async (e: SubmitEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (disabledSave || loading.send) return;

        mergeState({send: true}, setLoading);

        try {
            if (idProcess === null) {
                const {status} = await ApiService.process.post({
                    options: {
                        productId,
                        name: data.name.trim(),
                        description: data.description.trim(),
                        blankId: data.blankId || undefined,
                        files: data.files,
                    }
                });

                if (status === "success") {
                    addSnackbar({
                        type: "success",
                        text: `Успешно добавлено: "${data.name}"`,
                    });
                    onClose("updated-data");
                }
            } else {
                const options: PathProcessOptions = {};

                if (data.blankId !== savedData.blankId) {
                    options.blankId = data.blankId || null;
                }

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

                const {status} = await ApiService.process.patch({
                    id: idProcess,
                    options,
                });

                if (status === "success") {
                    addSnackbar({
                        type: "success",
                        text: `Успешно отредактировано: "${data.name}"`,
                    });
                    onClose("updated-data");
                }
            }
        } finally {
            mergeState({send: false}, setLoading);
        }
    };

    const title = useMemo(
        () => `${idProcess === null ? "Добавление" : "Редактирование"} техпроцесса`,
        [idProcess]
    );
    const blankDisabled = loading.send || data.locked || !productMaterialId;

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
                            form={"save-process"}
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
                <form id={"save-process"} className={"modalForm"} onSubmit={saveProcess}>
                    <FormItem
                        top={"Название"}
                        noPadding={true}
                    >
                        <Input
                            maxLength={50}
                            disabled={loading.send || data.locked}
                            value={data.name}
                            onChange={(e) => mergeState({name: e.target.value}, setData)}
                            placeholder={"Введите название"}
                            status={!data.name.trim() ? "error" : "default"}
                        />
                    </FormItem>
                    <FormItem
                        top={"Заготовка"}
                        noPadding={true}
                    >
                        <Select
                            filterFn={selectFilter.filterFn}
                            options={[
                                {value: 0, label: "Без заготовки"},
                                ...blanks,
                            ]}
                            searchable={true}
                            disabled={blankDisabled}
                            className={blankDisabled ? "disabled" : undefined}
                            value={data.blankId}
                            onChange={(e) => mergeState({blankId: Number(e.target.value)}, setData)}
                            placeholder={productMaterialId ? "Выберите заготовку" : "У изделия не выбран материал"}
                            onInputChange={selectFilter.onInputChange}
                            onOpen={selectFilter.onOpen}
                            onClose={selectFilter.onClose}
                        />
                    </FormItem>
                    <FormItem
                        top={"Файлы"}
                        noPadding={true}
                    >
                        <UploadFile
                            value={data.files}
                            savedFiles={data.existingFiles}
                            disabled={loading.send || data.locked}
                            maxFiles={20}
                            maxSize={100}
                            accept={['.zip', '.rar', '.7zip', 'image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/bmp', '.docx', '.doc', '.dotx', '.xls', '.xlsx', '.ppt', '.pptx', '.pdf']}
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
                            disabled={loading.send || data.locked}
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
    )
};

export default ModalManageProcess;
