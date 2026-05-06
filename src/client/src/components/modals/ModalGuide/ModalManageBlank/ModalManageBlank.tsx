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
import styles from './ModalManageBlank.module.scss'
import {mergeState} from "@/shared/helpers";
import {ApiService} from "@/apiService/apiService";
import {useSnackbarStore} from "@/store/snackbar/snackbar";
import {useController, useSelectFilter} from "@/shared/hooks";
import {ModalManageBlankProps} from "@/components/modals/ModalGuide/ModalManageBlank/types";
import {PostBlankOptions} from "@/apiService/apiGuide/types";
import {Icon24Done, Icon28SettingsOutline} from "@vkontakte/icons";
import ActionSheetIconPlug from "@/components/ActionSheetIconPlug";

const initialData: PostBlankOptions = {
    materialId: 0,
    name: "",
    description: "",
};

const ModalManageBlank = (props: ModalManageBlankProps) => {

    const {
        idBlank,
        preventClose,
        onClose = () => {},
        updateData = () => {},
        ...restProps
    } = props;

    const addSnackbar = useSnackbarStore(state => state.addSnackbar);
    const selectFilter = useSelectFilter();

    const [savedData, setSavedData] = useState({...initialData});
    const [data, setData] = useState({...initialData});
    const [loading, setLoading] = useState({
        get: true,
        material: false,
        send: false
    });
    const [filter, setFilter] = useState({
        materialGroupId: 0,
    });
    const [options, setOptions] = useState<Record<string, CustomSelectOptionInterface[]>>({
        materialGroup: [],
        material: []
    });

    const [actionSheet, setActionSheet] = useState<ReactNode>(null);
    const [typeSave, setTypeSave] = useState(1);

    const saveAsRef = useRef(null);
    const {
        controllerRef,
        createController,
        cancelRef
    } = useController([]);

    const getMaterials = async (id: number) => {
        mergeState({material: true}, setLoading);

        controllerRef.current?.abort();
        const controller = createController();

        await ApiService.guide.material.get({
            controller,
            options: { materialGroupId: id, sorting: {id: 'name', sort: 'asc'} },
        }).then(({status, data}) => {
            if (status === 'success') {
                mergeState({material: data.map(({id, name}) => ({
                    value: id,
                    label: name,
                }))}, setOptions);
                cancelRef.current = false;
            } else if (data === 'canceled') {
                cancelRef.current = true;
            } else if (idBlank === null) {
                onClose('error')
            }
        });
    };

    useEffect(() => {
        const controller = createController();

        ApiService.guide.materialGroup.get({
            options: {sorting: {id: 'name', sort: 'asc'}},
            controller
        }).then(async ({status, data}) => {
            if (status === 'success') {
                mergeState({materialGroup: data.map(({id, name}) => ({
                    value: id,
                    label: name,
                }))}, setOptions);

                if (idBlank !== null) {
                    await ApiService.guide.blank.getById({
                        id: idBlank,
                        controller
                    }).then(async ({status, data}) => {
                        if (status === 'success') {
                            const init = {
                                materialId: data.materialId,
                                name: data.name,
                                description: data.description ?? '',
                            };

                            mergeState({materialGroupId: data.material.materialGroupId}, setFilter);
                            await getMaterials(data.material.materialGroupId).finally(() => mergeState({material: false}, setLoading));

                            setSavedData(init);
                            setData(init);
                        } else onClose('error')
                    });
                }
            } else onClose('error')
        }).finally(() => mergeState({get: false}, setLoading));
    }, [idBlank])

    const handleChangeMaterialGroupId = async (id: number) => {
        mergeState({materialGroupId: id}, setFilter);
        mergeState({materialId: 0}, setData);
        if (id === 0) return;

        await getMaterials(id).finally(() => mergeState({material: cancelRef.current}, setLoading));
    };

    const saveBlank = async (e: SubmitEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (disabledSave || loading.send) return;

        mergeState({send: true}, setLoading);

        try {
            const { status } = idBlank === null ? await ApiService.guide.blank.post({
                options: {
                    materialId: data.materialId,
                    name: data.name.trim(),
                    description: data.description.trim(),
                }
            }) : await ApiService.guide.blank.patch({
                id: idBlank,
                options: {
                    materialId: data.materialId,
                    name: data.name.trim(),
                    description: data.description.trim(),
                }
            });

            if (status === 'success') {
                addSnackbar({
                    type: 'success',
                    text: `Успешно ${idBlank === null ? 'добавлено' : 'отредактировано'}: "${data.name}"`
                });

                if (typeSave) onClose('updated-data');
                else updateData();
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
        () => `${idBlank === null ? 'Добавление' : 'Редактирование'} заготовки`,
        [idBlank]
    );

    const disabledSave = useMemo(() => {
        const validRequired = !!data.name.trim() && !!data.materialId;
        const validEdit = validRequired && (
            data.materialId !== savedData.materialId ||
            data.name.trim() !== savedData.name.trim() ||
            data.description.trim() !== savedData.description.trim()
        );

        return idBlank === null ? !validRequired : !validEdit;
    }, [idBlank, data, savedData]);

    return (
        <ModalPage
            hideCloseButton={loading.send}
            onClose={onClose}
            preventClose={loading.send || preventClose || actionSheet !== null}
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
                            onClick={(e) => onClose('cancel', e)}
                        >
                            Отмена
                        </Button>
                        <ButtonGroup
                            gap={'none'}
                        >
                            <Button
                                form={'save-blank'}
                                type={'submit'}
                                disabled={disabledSave || loading.get}
                                loading={loading.send}
                                size={'m'}
                                className={classNames(idBlank === null && styles.save)}
                            >
                                {`Сохранить${idBlank === null ? (!!typeSave ? ' и выйти' : ' и остаться') : ''}`}
                            </Button>
                            {idBlank === null && (
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
                <form id={'save-blank'} className={'modalForm'} onSubmit={saveBlank}>
                    <FormItem
                        top={'Группа материалов'}
                        noPadding={true}
                    >
                        <Select
                            disabled={loading.send}
                            className={classNames(loading.send && 'disabled')}
                            filterFn={selectFilter.filterFn}
                            options={options.materialGroup}
                            searchable={true}
                            allowClearButton={true}
                            value={filter.materialGroupId}
                            onChange={(e) => handleChangeMaterialGroupId(Number(e.target.value))}
                            placeholder={'Выберите группу материалов'}
                            onInputChange={selectFilter.onInputChange}
                            onOpen={selectFilter.onOpen}
                            onClose={selectFilter.onClose}
                            status={filter.materialGroupId !== 0 ? 'default' : 'error'}
                        />
                    </FormItem>
                    <FormItem
                        top={'Материал'}
                        noPadding={true}
                    >
                        <Select
                            filterFn={selectFilter.filterFn}
                            options={options.material}
                            searchable={true}
                            fetching={loading.material}
                            disabled={loading.send || filter.materialGroupId === 0}
                            className={classNames((loading.send || filter.materialGroupId === 0) && 'disabled')}
                            value={data.materialId}
                            onChange={(e) => mergeState({materialId: Number(e.target.value)}, setData)}
                            placeholder={'Выберите материал'}
                            status={!data.materialId ? 'error' : 'default'}
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
                            maxLength={50}
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

export default ModalManageBlank;
