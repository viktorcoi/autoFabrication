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
import styles from './ModalManageBlank.module.scss'
import {mergeState} from "@/shared/helpers";
import {ApiService} from "@/apiService/apiService";
import {useSnackbarStore} from "@/store/snackbar/snackbar";
import {useController, useSelectFilter} from "@/shared/hooks";
import {ModalManageBlankProps} from "@/components/modals/ModalGuide/ModalManageBlank/types";
import {PostBlankOptions} from "@/apiService/apiGuide/types";

const initialData: PostBlankOptions = {
    materialId: 0,
    name: "",
    description: "",
};

const ModalManageBlank = (props: ModalManageBlankProps) => {

    const {
        idBlank,
        preventClose,
        onLoading,
        onClose = () => {},
        ...restProps
    } = props;

    const addSnackbar = useSnackbarStore(state => state.addSnackbar);
    const selectFilter = useSelectFilter();

    const [savedData, setSavedData] = useState({...initialData});
    const [data, setData] = useState({...initialData});
    const [materials, setMaterials] = useState<CustomSelectOptionInterface[]>([]);
    const [loading, setLoading] = useState({
        get: true,
        send: false
    });

    const { createController } = useController([]);

    useEffect(() => {
        const controller = createController();

        ApiService.guide.material.get({
            controller
        }).then(async ({status, data}) => {
            if (status === 'success') {
                setMaterials(data.map(({id, name}) => ({
                    value: id,
                    label: name,
                })));

                if (idBlank !== null) {
                    await ApiService.guide.blank.getById({
                        id: idBlank,
                        controller
                    }).then(({status, data}) => {
                        if (status === 'success') {
                            const init = {
                                materialId: data.materialId,
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
    }, [idBlank])

    const saveBlank = async (e: SubmitEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (disabledSave || loading.send) return;

        mergeState({send: true}, setLoading);
        onLoading(true);

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

                onClose('updated-data');
            }
        } finally {
            mergeState({send: false}, setLoading);
            onLoading(false);
        }
    }

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
                            form={'save-blank'}
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
                <form id={'save-blank'} className={'modalForm'} onSubmit={saveBlank}>
                    <FormItem
                        top={'Материал'}
                        noPadding={true}
                    >
                        <Select
                            filterFn={selectFilter.filterFn}
                            options={materials}
                            searchable={true}
                            disabled={loading.send}
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

export default ModalManageBlank;
