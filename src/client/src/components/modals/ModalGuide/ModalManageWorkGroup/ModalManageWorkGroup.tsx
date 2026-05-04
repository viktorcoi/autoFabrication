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
import styles from './ModalManageWorkGroup.module.scss'
import {mergeState} from "@/shared/helpers";
import {ApiService} from "@/apiService/apiService";
import {useSnackbarStore} from "@/store/snackbar/snackbar";
import {useController, useSelectFilter} from "@/shared/hooks";
import {ModalManageWorkGroupProps} from "@/components/modals/ModalGuide/ModalManageWorkGroup/types";
import {PostWorkGroupOptions} from "@/apiService/apiGuide/types";
import {Icon24Done, Icon28SettingsOutline} from "@vkontakte/icons";
import ActionSheetIconPlug from "@/components/ActionSheetIconPlug";

const initialData: PostWorkGroupOptions = {
    operationId: 0,
    name: "",
    description: "",
};

const ModalManageWorkGroup = (props: ModalManageWorkGroupProps) => {

    const {
        idWorkGroup,
        preventClose,
        onLoading,
        updateData = () => {},
        onClose = () => {},
        ...restProps
    } = props;

    const addSnackbar = useSnackbarStore(state => state.addSnackbar);
    const selectFilter = useSelectFilter();

    const [savedData, setSavedData] = useState({...initialData});
    const [data, setData] = useState({...initialData});
    const [loading, setLoading] = useState({
        get: true,
        operation: false,
        send: false
    });
    const [filter, setFilter] = useState({
        operationGroupId: 0,
    });
    const [options, setOptions] = useState<Record<string, CustomSelectOptionInterface[]>>({
        operationGroup: [],
        operation: []
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
            options: { operationGroupId: id },
        }).then(async ({status, data}) => {
            if (status === 'success') {
                mergeState({operation: data.map(({id, name}) => ({
                    value: id,
                    label: name,
                }))}, setOptions);
                cancelRef.current = false;
            } else if (data === 'canceled') {
                cancelRef.current = true;
            } else if (idWorkGroup === null) {
                onClose('error')
            }
        });
    };

    useEffect(() => {
        const controller = createController();

        ApiService.guide.operationGroup.get({
            controller
        }).then(async ({status, data}) => {
            if (status === 'success') {
                mergeState({operationGroup: data.map(({id, name}) => ({
                    value: id,
                    label: name,
                }))}, setOptions);

                if (idWorkGroup !== null) {
                    await ApiService.guide.workGroup.getById({
                        id: idWorkGroup,
                        controller
                    }).then(async ({status, data}) => {
                        if (status === 'success') {
                            const init = {
                                operationId: data.operationId,
                                name: data.name,
                                description: data.description ?? '',
                            };

                            mergeState({operationGroupId: data.operation.operationGroupId}, setFilter);
                            await getOperations(data.operation.operationGroupId).finally(() => mergeState({operation: false}, setLoading));

                            setSavedData(init);
                            setData(init);
                        } else onClose('error')
                    });
                }
            } else onClose('error')
        }).finally(() => mergeState({get: false}, setLoading));
    }, [idWorkGroup])

    const handleChangeOperationGroupId = async (id: number) => {
        mergeState({operationGroupId: id}, setFilter);
        mergeState({operationId: 0}, setData);
        if (id === 0) return;

        await getOperations(id).finally(() => mergeState({operation: cancelRef.current}, setLoading));
    };

    const saveWorkGroup = async (e: SubmitEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (disabledSave || loading.send) return;

        mergeState({send: true}, setLoading);
        onLoading(true);

        try {
            const { status } = idWorkGroup === null ? await ApiService.guide.workGroup.post({
                options: {
                    operationId: data.operationId,
                    name: data.name.trim(),
                    description: data.description.trim(),
                }
            }) : await ApiService.guide.workGroup.patch({
                id: idWorkGroup,
                options: {
                    operationId: data.operationId,
                    name: data.name.trim(),
                    description: data.description.trim(),
                }
            });

            if (status === 'success') {
                addSnackbar({
                    type: 'success',
                    text: `Успешно ${idWorkGroup === null ? 'добавлено' : 'отредактировано'}: "${data.name}"`
                });

                if (typeSave) onClose('updated-data');
                else updateData();
            }
        } finally {
            mergeState({send: false}, setLoading);
            onLoading(false);
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
        () => `${idWorkGroup === null ? 'Добавление' : 'Редактирование'} группы работ`,
        [idWorkGroup]
    );

    const disabledSave = useMemo(() => {
        const validRequired = !!data.name.trim() && !!data.operationId;
        const validEdit = validRequired && (
            data.operationId !== savedData.operationId ||
            data.name.trim() !== savedData.name.trim() ||
            data.description.trim() !== savedData.description.trim()
        );

        return idWorkGroup === null ? !validRequired : !validEdit;
    }, [idWorkGroup, data, savedData]);

    return (
        <ModalPage
            hideCloseButton={loading.send}
            onClose={onClose}
            preventClose={preventClose}
            header={
                <PlatformProvider value={'ios'}>
                    <ModalPageHeader>{title}</ModalPageHeader>
                </PlatformProvider>
            }
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
                        <ButtonGroup
                            gap={'none'}
                        >
                            <Button
                                form={'save-work-group'}
                                type={'submit'}
                                className={classNames(idWorkGroup === null && styles.save)}
                                disabled={disabledSave || loading.get}
                                loading={loading.send}
                                size={'m'}
                            >
                                {`Сохранить${idWorkGroup === null ? (!!typeSave ? ' и выйти' : ' и остаться') : ''}`}
                            </Button>
                            {idWorkGroup === null && (
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
                <form id={'save-work-group'} className={'modalForm'} onSubmit={saveWorkGroup}>
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
                            filterFn={selectFilter.filterFn}
                            options={options.operation}
                            searchable={true}
                            fetching={loading.operation}
                            disabled={loading.send || filter.operationGroupId === 0}
                            className={classNames((loading.send || filter.operationGroupId === 0) && 'disabled')}
                            value={data.operationId}
                            onChange={(e) => mergeState({operationId: Number(e.target.value)}, setData)}
                            placeholder={'Выберите операцию'}
                            status={!data.operationId ? 'error' : 'default'}
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
                            disabled={loading.send}
                            value={data.name}
                            onChange={(e) => mergeState({name: e.target.value}, setData)}
                            placeholder={'Введите название'}
                            status={!data.name.trim() ? 'error' : 'default'}
                            maxLength={30}
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

export default ModalManageWorkGroup;
