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
import {mergeState} from "@/shared/helpers";
import {ApiService} from "@/apiService/apiService";
import {useSnackbarStore} from "@/store/snackbar/snackbar";
import {useController, useSelectFilter} from "@/shared/hooks";
import {OperationFileItem, PathOperationOptions, PostOperationOptions} from "@/apiService/apiGuide/types";
import UploadFile from "@/components/UploadFile/UploadFile";
import {ModalManageOperationProps} from "@/components/modals/ModalGuide/ModalManageOperation/types";
import styles from './ModalManageOperation.module.scss';
import {Icon24Done, Icon28SettingsOutline} from "@vkontakte/icons";
import ActionSheetIconPlug from "@/components/ActionSheetIconPlug";

type ManageOperationData = {
    operationGroupId: number;
    name: string;
    description: string;
    files: File[];
    existingFiles: OperationFileItem[];
};

const initialData: ManageOperationData = {
    operationGroupId: 0,
    name: "",
    description: "",
    files: [],
    existingFiles: [],
};

const getFileIds = (files: OperationFileItem[]) => files.map((file) => file.id).sort((a, b) => a - b);

const ModalManageOperation = (props: ModalManageOperationProps) => {

    const {
        idOperation,
        preventClose,
        onClose = () => {},
        updateData = () => {},
        ...restProps
    } = props;

    const addSnackbar = useSnackbarStore(state => state.addSnackbar);
    const selectFilter = useSelectFilter();

    const [savedData, setSavedData] = useState<ManageOperationData>({...initialData});
    const [data, setData] = useState<ManageOperationData>({...initialData});
    const [operationGroups, setOperationGroups] = useState<CustomSelectOptionInterface[]>([]);
    const [loading, setLoading] = useState({
        get: true,
        send: false
    });

    const [actionSheet, setActionSheet] = useState<ReactNode>(null);
    const [typeSave, setTypeSave] = useState(1);

    const saveAsRef = useRef(null);
    const { createController } = useController([]);

    useEffect(() => {
        const controller = createController();

        ApiService.guide.operationGroup.get({
            options: {sorting: {id: 'name', sort: 'asc'}},
            controller
        }).then(async ({status, data}) => {
            if (status === 'success') {
                setOperationGroups(data.map(({id, name}) => ({
                    value: id,
                    label: name,
                })));

                if (idOperation !== null) {
                    await ApiService.guide.operation.getById({
                        id: idOperation,
                        controller
                    }).then(({status, data}) => {
                        if (status === 'success') {
                            const init: ManageOperationData = {
                                operationGroupId: data.operationGroupId,
                                name: data.name,
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
    }, [idOperation]);

    const removedFileIds = useMemo(
        () => getFileIds(savedData.existingFiles).filter((fileId) => !getFileIds(data.existingFiles).includes(fileId)),
        [data.existingFiles, savedData.existingFiles]
    );

    const saveOperation = async (e: SubmitEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (disabledSave || loading.send) return;

        mergeState({send: true}, setLoading);

        try {
            if (idOperation === null) {
                const { status } = await ApiService.guide.operation.post({
                    options: {
                        operationGroupId: data.operationGroupId,
                        name: data.name.trim(),
                        description: data.description.trim(),
                        files: data.files,
                    } satisfies PostOperationOptions
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
                const options: PathOperationOptions = {};

                if (data.operationGroupId !== savedData.operationGroupId) {
                    options.operationGroupId = data.operationGroupId;
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

                const { status } = await ApiService.guide.operation.patch({
                    id: idOperation,
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
        () => `${idOperation === null ? 'Добавление' : 'Редактирование'} операции`,
        [idOperation]
    );

    const disabledSave = useMemo(() => {
        const validRequired = !!data.name.trim() && !!data.operationGroupId;
        const validEdit = validRequired && (
            data.operationGroupId !== savedData.operationGroupId ||
            data.name.trim() !== savedData.name.trim() ||
            data.description.trim() !== savedData.description.trim() ||
            data.files.length > 0 ||
            removedFileIds.length > 0
        );

        return idOperation === null ? !validRequired : !validEdit;
    }, [idOperation, data, savedData, removedFileIds]);

    return (
        <ModalPage
            hideCloseButton={loading.send}
            onClose={onClose}
            preventClose={preventClose || loading.send}
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
                                form={'save-operation'}
                                type={'submit'}
                                className={classNames(idOperation === null && styles.save)}
                                disabled={disabledSave || loading.get}
                                loading={loading.send}
                                size={'m'}
                            >
                                {`Сохранить${idOperation === null ? (!!typeSave ? ' и выйти' : ' и остаться') : ''}`}
                            </Button>
                            {idOperation === null && (
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
                <form id={'save-operation'} className={'modalForm'} onSubmit={saveOperation}>
                    <FormItem
                        top={'Группа операций'}
                        noPadding={true}
                    >
                        <Select
                            filterFn={selectFilter.filterFn}
                            options={operationGroups}
                            searchable={true}
                            disabled={loading.send}
                            className={classNames(loading.send && 'disabled')}
                            value={data.operationGroupId}
                            onChange={(e) => mergeState({operationGroupId: Number(e.target.value)}, setData)}
                            placeholder={'Выберите группу операций'}
                            status={!data.operationGroupId ? 'error' : 'default'}
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
                    <FormItem
                        top={'Файлы'}
                        noPadding={true}
                    >
                        <UploadFile
                            value={data.files}
                            savedFiles={data.existingFiles}
                            disabled={loading.send}
                            maxFiles={20}
                            maxSize={100}
                            accept={['.zip', '.rar', '.7zip', 'image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/bmp','.docx', '.doc', '.dotx', '.xls', '.xlsx', '.ppt', '.pptx', '.pdf']}
                            maxTotalSize={200}
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

export default ModalManageOperation;
