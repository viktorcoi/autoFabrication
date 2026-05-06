import {
    ActionSheet, ActionSheetItem,
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
import {ReactNode, SubmitEvent, useEffect, useMemo, useRef, useState} from "react";
import {mergeState, sanitizeSingleDecimalInput} from "@/shared/helpers";
import {ApiService} from "@/apiService/apiService";
import {useSnackbarStore} from "@/store/snackbar/snackbar";
import {useController, useSelectFilter} from "@/shared/hooks";
import {ModalManageWorkProps} from "@/components/modals/ModalGuide/ModalManageWork/types";
import {PathWorkOptions, PostWorkOptions, WorkFileItem} from "@/apiService/apiGuide/types";
import UploadFile from "@/components/UploadFile/UploadFile";
import styles from './ModalManageWork.module.scss';
import {
    Icon24Done,
    Icon28SettingsOutline
} from "@vkontakte/icons";
import ActionSheetIconPlug from "@/components/ActionSheetIconPlug";

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
        onClose = () => {},
        updateData = () => {},
        ...restProps
    } = props;

    const addSnackbar = useSnackbarStore(state => state.addSnackbar);
    const selectFilter = useSelectFilter();

    const [savedData, setSavedData] = useState<ManageWorkData>({...initialData});
    const [data, setData] = useState<ManageWorkData>({...initialData});

    const [loading, setLoading] = useState({
        get: true,
        operation: false,
        workGroup: false,
        send: false
    });
    const [filter, setFilter] = useState({
        operationGroupId: 0,
        operationId: 0,
    });
    const [options, setOptions] = useState<Record<string, CustomSelectOptionInterface[]>>({
        operationGroup: [],
        operation: [],
        workGroup: []
    });
    const [actionSheet, setActionSheet] = useState<ReactNode>(null);
    const [typeSave, setTypeSave] = useState(1);

    const saveAsRef = useRef(null);
    const {
        controllerRef,
        createController,
        cancelRef
    } = useController([]);

    const getOperations = async (id: number) => {
        mergeState({operation: true}, setLoading);

        controllerRef.current?.abort();
        const controller = createController();

        await ApiService.guide.operation.get({
            controller,
            options: { operationGroupId: id, sorting: {id: 'name', sort: 'asc'} },
        }).then(async ({status, data}) => {
            if (status === 'success') {
                mergeState({operation: data.map(({id, name}) => ({
                    value: id,
                    label: name,
                }))}, setOptions);
                cancelRef.current = false;
            } else if (data === 'canceled') {
                cancelRef.current = true;
            } else if (idWork === null) {
                onClose('error')
            }
        });
    };

    const getWorkGroups = async (id: number) => {
        mergeState({workGroup: true}, setLoading);

        controllerRef.current?.abort();
        const controller = createController();

        await ApiService.guide.workGroup.get({
            controller,
            options: { operationId: id, sorting: {id: 'name', sort: 'asc'} },
        }).then(({status, data}) => {
            if (status === 'success') {
                mergeState({workGroup: data.map(({id, name}) => ({
                    value: id,
                    label: name,
                }))}, setOptions);
                cancelRef.current = false;
            } else if (data === 'canceled') {
                cancelRef.current = true;
            } else if (idWork === null) {
                onClose('error')
            }
        });
    };

    useEffect(() => {
        const controller = createController();

        ApiService.guide.operationGroup.get({
            options: {sorting: {id: 'name', sort: 'asc'}},
            controller,
        }).then(async ({status, data}) => {
            if (status === 'success') {
                mergeState({operationGroup: data.map(({id, name}) => ({
                    value: id,
                    label: name,
                }))}, setOptions);

                if (idWork !== null) {
                    await ApiService.guide.work.getById({
                        id: idWork,
                        controller
                    }).then(async ({status, data}) => {
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

                            mergeState({
                                operationGroupId: data.workGroup.operation.operationGroupId,
                                operationId: data.workGroup.operationId
                            }, setFilter);

                            await getOperations(data.workGroup.operation.operationGroupId).finally(() => mergeState({operation: false}, setLoading));
                            await getWorkGroups(data.workGroup.operationId).finally(() => mergeState({workGroup: false}, setLoading));

                            setSavedData(init);
                            setData(init);
                        } else onClose('error')
                    });
                }
            } else onClose('error')
        }).finally(() => mergeState({get: false}, setLoading));
    }, [idWork]);

    const handleChangeOperationGroupId = async (id: number) => {
        mergeState({operationGroupId: id}, setFilter);
        mergeState({operationId: 0}, setFilter);
        mergeState({workGroupId: 0}, setData);
        if (id === 0) return;

        await getOperations(id).finally(() => mergeState({operation: cancelRef.current}, setLoading));
    };

    const handleChangeOperationId = async (id: number) => {
        mergeState({operationId: id}, setFilter);
        mergeState({workGroupId: 0}, setData);
        if (id === 0) return;

        await getWorkGroups(id).finally(() => mergeState({workGroup: cancelRef.current}, setLoading));
    };

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
                    if (typeSave) onClose('updated-data');
                    else updateData();
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
        }
    };

    const openSaveAs = () => {
        setActionSheet(
            <ActionSheet
                placement={'top-end'}
                popupOffsetDistance={8}
                toggleRef={saveAsRef}
                onClosed={() => setActionSheet(null)}
            >
                {['и остаться', 'и выйти'].map((i, key) => (
                    <ActionSheetItem
                        key={key}
                        onClick={() => setTypeSave(key)}
                        after={typeSave === key ? <Icon24Done width={21} height={21}/> : <ActionSheetIconPlug/>}
                    >
                        {`Сохранить ${i}`}
                    </ActionSheetItem>
                ))}
            </ActionSheet>,
        );
    };

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
            preventClose={loading.send || preventClose || actionSheet !== null}
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
                            onClick={(e) => onClose('cancel', e)}
                        >
                            Отмена
                        </Button>
                        <ButtonGroup
                            gap={'none'}
                        >
                            <Button
                                form={'save-work'}
                                type={'submit'}
                                className={classNames(idWork === null && styles.save)}
                                disabled={disabledSave || loading.get}
                                loading={loading.send}
                                size={'m'}
                            >
                                {`Сохранить${idWork === null ? (!!typeSave ? ' и выйти' : ' и остаться') : ''}`}
                            </Button>
                            {idWork === null && (
                                <Button
                                    getRootRef={saveAsRef}
                                    onClick={openSaveAs}
                                    className={styles.as}
                                    disabled={loading.send}
                                    after={<Icon28SettingsOutline width={24} height={24}/>}
                                    size={'m'}
                                />
                            )}
                        </ButtonGroup>
                    </ButtonGroup>
                </div>
            )}
            {...restProps}
        >
            {actionSheet}
            {loading.get ? <Spinner size={'xl'} className={styles.plug}/> : (
                <form id={'save-work'} className={'modalForm'} onSubmit={saveWork}>
                    <FormItem
                        top={'Группа операций'}
                        noPadding={true}
                    >
                        <Select
                            disabled={loading.send}
                            className={classNames(loading.send && 'disabled')}
                            filterFn={selectFilter.filterFn}
                            options={options.operationGroup}
                            searchable={true}
                            allowClearButton={true}
                            value={filter.operationGroupId}
                            onChange={(e) => handleChangeOperationGroupId(Number(e.target.value))}
                            placeholder={'Выберите группу операций'}
                            onInputChange={selectFilter.onInputChange}
                            onOpen={selectFilter.onOpen}
                            onClose={selectFilter.onClose}
                            status={filter.operationGroupId !== 0 ? 'default' : 'error'}
                        />
                    </FormItem>
                    <FormItem
                        top={'Операция'}
                        noPadding={true}
                    >
                        <Select
                            disabled={loading.send || filter.operationGroupId === 0}
                            className={classNames((loading.send || filter.operationGroupId === 0) && 'disabled')}
                            filterFn={selectFilter.filterFn}
                            options={options.operation}
                            searchable={true}
                            allowClearButton={true}
                            fetching={loading.operation}
                            value={filter.operationId}
                            onChange={(e) => handleChangeOperationId(Number(e.target.value))}
                            placeholder={'Выберите операцию'}
                            onInputChange={selectFilter.onInputChange}
                            onOpen={selectFilter.onOpen}
                            onClose={selectFilter.onClose}
                            status={filter.operationId !== 0 ? 'default' : 'error'}
                        />
                    </FormItem>
                    <FormItem
                        top={'Группа работ'}
                        noPadding={true}
                    >
                        <Select
                            filterFn={selectFilter.filterFn}
                            options={options.workGroup}
                            searchable={true}
                            fetching={loading.workGroup}
                            disabled={loading.send || filter.operationId === 0}
                            className={classNames((loading.send || filter.operationId === 0) && 'disabled')}
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
                            maxLength={50}
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
