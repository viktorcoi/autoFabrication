import {
    Button,
    ButtonGroup, classNames,
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
import {mergeState, sanitizeSingleDecimalInput} from "@/shared/helpers";
import {ApiService} from "@/apiService/apiService";
import {useSnackbarStore} from "@/store/snackbar/snackbar";
import {useController, useSelectFilter} from "@/shared/hooks";
import {ModalManageWorkProps} from "@/components/modals/ModalGuide/ModalManageWork/types";
import {PathWorkOptions, PostWorkOptions, WorkFileItem} from "@/apiService/apiGuide/types";
import UploadFile from "@/components/UploadFile/UploadFile";
import styles from './ModalManageWork.module.scss';

type ManageWorkData = {
    workGroupId: number;
    name: string;
    tpz: string;
    tsht: string;
    description: string;
    files: File[];
    existingFiles: WorkFileItem[];
};

const initialData: ManageWorkData = {
    workGroupId: 0,
    name: "",
    tpz: "",
    tsht: "",
    description: "",
    files: [],
    existingFiles: [],
};

const getFileIds = (files: WorkFileItem[]) => files.map((file) => file.id).sort((a, b) => a - b);

const parseTimeInput = (value: string) => {
    const normalized = value.trim().replace(',', '.');

    if (!normalized.length) {
        return null;
    }

    if (!/^\d+(?:\.\d)?$/.test(normalized)) {
        return null;
    }

    const parsed = Number(normalized);

    if (!Number.isFinite(parsed) || parsed < 0) {
        return null;
    }

    return {
        normalized,
        value: parsed,
    };
};

const formatTimeValue = (value: number) => value.toFixed(1);

const ModalManageWork = (props: ModalManageWorkProps) => {

    const {
        idWork,
        preventClose,
        onLoading,
        onClose = () => {},
        ...restProps
    } = props;

    const addSnackbar = useSnackbarStore(state => state.addSnackbar);
    const selectFilter = useSelectFilter();

    const [savedData, setSavedData] = useState<ManageWorkData>({...initialData});
    const [data, setData] = useState<ManageWorkData>({...initialData});
    const [workGroups, setWorkGroups] = useState<CustomSelectOptionInterface[]>([]);
    const [loading, setLoading] = useState({
        get: true,
        send: false
    });

    const { createController } = useController([]);

    useEffect(() => {
        const controller = createController();

        ApiService.guide.workGroup.get({
            controller
        }).then(async ({status, data}) => {
            if (status === 'success') {
                setWorkGroups(data.map(({id, name}) => ({
                    value: id,
                    label: name,
                })));

                if (idWork !== null) {
                    await ApiService.guide.work.getById({
                        id: idWork,
                        controller
                    }).then(({status, data}) => {
                        if (status === 'success') {
                            const init: ManageWorkData = {
                                workGroupId: data.workGroupId,
                                name: data.name,
                                tpz: formatTimeValue(data.tpz),
                                tsht: formatTimeValue(data.tsht),
                                description: data.description ?? '',
                                files: [],
                                existingFiles: data.files,
                            };

                            setSavedData(init);
                            setData(init);
                        } else onClose('error')
                    });
                }
            } else onClose('error')
        }).finally(() => mergeState({get: false}, setLoading));
    }, [idWork]);

    const removedFileIds = useMemo(
        () => getFileIds(savedData.existingFiles).filter((fileId) => !getFileIds(data.existingFiles).includes(fileId)),
        [data.existingFiles, savedData.existingFiles]
    );

    const parsedTpz = useMemo(() => parseTimeInput(data.tpz), [data.tpz]);
    const parsedTsht = useMemo(() => parseTimeInput(data.tsht), [data.tsht]);
    const savedTpz = useMemo(() => parseTimeInput(savedData.tpz), [savedData.tpz]);
    const savedTsht = useMemo(() => parseTimeInput(savedData.tsht), [savedData.tsht]);

    const saveWork = async (e: SubmitEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (disabledSave || loading.send || !parsedTpz || !parsedTsht) return;

        mergeState({send: true}, setLoading);
        onLoading(true);

        try {
            if (idWork === null) {
                const { status } = await ApiService.guide.work.post({
                    options: {
                        workGroupId: data.workGroupId,
                        name: data.name.trim(),
                        tpz: parsedTpz.value,
                        tsht: parsedTsht.value,
                        description: data.description.trim(),
                        files: data.files,
                    } satisfies PostWorkOptions
                });

                if (status === 'success') {
                    addSnackbar({
                        type: 'success',
                        text: `Успешно добавлено: "${data.name}"`
                    });
                    onClose('updated-data');
                }
            } else {
                const options: PathWorkOptions = {};

                if (data.workGroupId !== savedData.workGroupId) {
                    options.workGroupId = data.workGroupId;
                }

                if (data.name.trim() !== savedData.name.trim()) {
                    options.name = data.name.trim();
                }

                if (parsedTpz.value !== savedTpz?.value) {
                    options.tpz = parsedTpz.value;
                }

                if (parsedTsht.value !== savedTsht?.value) {
                    options.tsht = parsedTsht.value;
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

                const { status } = await ApiService.guide.work.patch({
                    id: idWork,
                    options,
                });

                if (status === 'success') {
                    addSnackbar({
                        type: 'success',
                        text: `Успешно отредактировано: "${data.name}"`
                    });
                    onClose('updated-data');
                }
            }
        } finally {
            mergeState({send: false}, setLoading);
            onLoading(false);
        }
    }

    const title = useMemo(
        () => `${idWork === null ? 'Добавление' : 'Редактирование'} работы`,
        [idWork]
    );

    const disabledSave = useMemo(() => {
        const validRequired = !!data.name.trim() && !!data.workGroupId && !!parsedTpz && !!parsedTsht;
        const validEdit = validRequired && (
            data.workGroupId !== savedData.workGroupId ||
            data.name.trim() !== savedData.name.trim() ||
            parsedTpz.value !== savedTpz?.value ||
            parsedTsht.value !== savedTsht?.value ||
            data.description.trim() !== savedData.description.trim() ||
            data.files.length > 0 ||
            removedFileIds.length > 0
        );

        return idWork === null ? !validRequired : !validEdit;
    }, [idWork, data, savedData, parsedTpz, parsedTsht, savedTpz, savedTsht, removedFileIds]);

    return (
        <ModalPage
            height={640}
            hideCloseButton={loading.send}
            onClose={onClose}
            preventClose={preventClose}
            header={(
                <PlatformProvider value={'ios'}>
                    <ModalPageHeader>{title}</ModalPageHeader>
                </PlatformProvider>
            )}
            footer={(
                <div className={'modalFooter'}>
                    <ButtonGroup
                        stretched={true}
                        align={'right'}
                    >
                        <Button
                            disabled={loading.send}
                            size={'m'}
                            mode={'secondary'}
                            onClick={(e) => {
                                if (preventClose) return;
                                onClose('cancel', e);
                            }}
                        >
                            Отмена
                        </Button>
                        <Button
                            form={'save-work'}
                            type={'submit'}
                            disabled={disabledSave || loading.get}
                            loading={loading.send}
                            size={'m'}
                        >
                            Сохранить
                        </Button>
                    </ButtonGroup>
                </div>
            )}
            {...restProps}
        >
            {loading.get ? <Spinner size={'xl'} className={styles.plug}/> : (
                <form id={'save-work'} className={'modalForm'} onSubmit={saveWork}>
                    <FormItem
                        top={'Группа работ'}
                        noPadding={true}
                    >
                        <Select
                            filterFn={selectFilter.filterFn}
                            options={workGroups}
                            searchable={true}
                            disabled={loading.send}
                            className={classNames(loading.send && 'disabled')}
                            value={data.workGroupId}
                            onChange={(e) => mergeState({workGroupId: Number(e.target.value)}, setData)}
                            placeholder={'Выберите группу работ'}
                            status={!data.workGroupId ? 'error' : 'default'}
                            onInputChange={selectFilter.onInputChange}
                            onOpen={selectFilter.onOpen}
                            onClose={selectFilter.onClose}
                        />
                    </FormItem>
                    <FormItem
                        top={'Название'}
                        noPadding={true}
                    >
                        <Input
                            maxLength={30}
                            disabled={loading.send}
                            value={data.name}
                            onChange={(e) => mergeState({name: e.target.value}, setData)}
                            placeholder={'Введите название'}
                            status={!data.name.trim() ? 'error' : 'default'}
                        />
                    </FormItem>
                    <div className={styles.times}>
                        <FormItem
                            top={'Тпз'}
                            noPadding={true}
                        >
                            <Input
                                disabled={loading.send}
                                value={data.tpz}
                                inputMode={'decimal'}
                                onChange={(e) => mergeState({tpz: sanitizeSingleDecimalInput(e.target.value)}, setData)}
                                placeholder={'Например 1.5'}
                                status={!parsedTpz ? 'error' : 'default'}
                            />
                        </FormItem>
                        <FormItem
                            top={'Тшт'}
                            noPadding={true}
                        >
                            <Input
                                disabled={loading.send}
                                value={data.tsht}
                                inputMode={'decimal'}
                                onChange={(e) => mergeState({tsht: sanitizeSingleDecimalInput(e.target.value)}, setData)}
                                placeholder={'Например 0.8'}
                                status={!parsedTsht ? 'error' : 'default'}
                            />
                        </FormItem>
                    </div>
                    <FormItem
                        top={'Файлы'}
                        noPadding={true}
                    >
                        <UploadFile
                            value={data.files}
                            savedFiles={data.existingFiles}
                            disabled={loading.send}
                            maxFiles={10}
                            maxSize={20}
                            accept={['.zip', '.rar', '.7zip', 'image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/bmp','.docx', '.doc', '.dotx', '.xls', '.xlsx', '.ppt', '.pptx', '.pdf']}
                            maxTotalSize={100}
                            onChange={(files) => mergeState({files}, setData)}
                            onRemoveSavedFile={(file) => mergeState({
                                existingFiles: data.existingFiles.filter((item) => item.id !== file.id)
                            }, setData)}
                            onError={(error) => addSnackbar({
                                type: 'error',
                                text: error.message,
                            })}
                        />
                    </FormItem>
                    <FormItem
                        className={'count-symbols'}
                        top={'Описание'}
                        noPadding={true}
                        bottom={`${data.description.length} из 255`}
                    >
                        <Textarea
                            disabled={loading.send}
                            value={data.description}
                            onChange={(e) => mergeState({description: e.target.value}, setData)}
                            className={styles.textarea}
                            placeholder={'Введите описание'}
                            maxLength={255}
                        />
                    </FormItem>
                </form>
            )}
        </ModalPage>
    )
};

export default ModalManageWork;
