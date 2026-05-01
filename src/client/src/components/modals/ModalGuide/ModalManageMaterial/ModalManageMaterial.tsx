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
import styles from './ModalManageMaterial.module.scss'
import {mergeState} from "@/shared/helpers";
import {ApiService} from "@/apiService/apiService";
import {useSnackbarStore} from "@/store/snackbar/snackbar";
import {useController, useSelectFilter} from "@/shared/hooks";
import {ModalManageMaterialProps} from "@/components/modals/ModalGuide/ModalManageMaterial/types";
import {PostMaterialOptions} from "@/apiService/apiGuide/types";

const initialData: PostMaterialOptions = {
    materialGroupId: 0,
    name: "",
    description: "",
};

const ModalManageMaterial = (props: ModalManageMaterialProps) => {

    const {
        idMaterial,
        preventClose,
        onLoading,
        onClose = () => {},
        ...restProps
    } = props;

    const addSnackbar = useSnackbarStore(state => state.addSnackbar);
    const selectFilter = useSelectFilter();

    const [savedData, setSavedData] = useState({...initialData});
    const [data, setData] = useState({...initialData});
    const [materialGroups, setMaterialGroups] = useState<CustomSelectOptionInterface[]>([]);
    const [loading, setLoading] = useState({
        get: true,
        send: false
    });

    const { createController } = useController([]);

    useEffect(() => {
        const controller = createController();

        ApiService.guide.materialGroup.get({
            controller
        }).then(async ({status, data}) => {
            if (status === 'success') {
                setMaterialGroups(data.map(({id, name}) => ({
                    value: id,
                    label: name,
                })));

                if (idMaterial !== null) {
                    await ApiService.guide.material.getById({
                        id: idMaterial,
                        controller
                    }).then(({status, data}) => {
                        if (status === 'success') {
                            const init = {
                                materialGroupId: data.materialGroupId,
                                name: data.name,
                                description: data.description ?? '',
                            };

                            setSavedData(init);
                            setData(init);
                        } else onClose('error')
                    });
                }
            } else onClose('error')
        }).finally(() => mergeState({get: false}, setLoading));
    }, [idMaterial])

    const saveMaterial = async (e: SubmitEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (disabledSave || loading.send) return;

        mergeState({send: true}, setLoading);
        onLoading(true);

        try {
            const { status } = idMaterial === null ? await ApiService.guide.material.post({
                options: {
                    materialGroupId: data.materialGroupId,
                    name: data.name.trim(),
                    description: data.description.trim(),
                }
            }) : await ApiService.guide.material.patch({
                id: idMaterial,
                options: {
                    materialGroupId: data.materialGroupId,
                    name: data.name.trim(),
                    description: data.description.trim(),
                }
            });

            if (status === 'success') {
                addSnackbar({
                    type: 'success',
                    text: `Успешно ${idMaterial === null ? 'добавлено' : 'отредактировано'}: "${data.name}"`
                });

                onClose('updated-data');
            }
        } finally {
            mergeState({send: false}, setLoading);
            onLoading(false);
        }
    }

    const title = useMemo(
        () => `${idMaterial === null ? 'Добавление' : 'Редактирование'} материала`,
        [idMaterial]
    );

    const disabledSave = useMemo(() => {
        const validRequired = !!data.name.trim() && !!data.materialGroupId;
        const validEdit = validRequired && (
            data.materialGroupId !== savedData.materialGroupId ||
            data.name.trim() !== savedData.name.trim() ||
            data.description.trim() !== savedData.description.trim()
        );

        return idMaterial === null ? !validRequired : !validEdit;
    }, [idMaterial, data, savedData]);

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
                        <Button
                            form={'save-material'}
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
                <form id={'save-material'} className={'modalForm'} onSubmit={saveMaterial}>
                    <FormItem
                        top={'Группа материалов'}
                        noPadding={true}
                    >
                        <Select
                            filterFn={selectFilter.filterFn}
                            options={materialGroups}
                            searchable={true}
                            disabled={loading.send}
                            value={data.materialGroupId}
                            onChange={(e) => mergeState({materialGroupId: Number(e.target.value)}, setData)}
                            placeholder={'Выберите группу материалов'}
                            status={!data.materialGroupId ? 'error' : 'default'}
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

export default ModalManageMaterial;
