import {
    Button,
    ButtonGroup,
    FormItem,
    Input,
    ModalPage,
    ModalPageHeader,
    PlatformProvider, Spinner,
    Textarea
} from "@vkontakte/vkui";
import {SubmitEvent, useEffect, useMemo, useState} from "react";
import styles from './ModalManageMaterialGroup.module.scss'
import {mergeState} from "@/shared/helpers";
import {ApiService} from "@/apiService/apiService";
import {useSnackbarStore} from "@/store/snackbar/snackbar";
import {useController} from "@/shared/hooks";
import {ModalManageMaterialGroupProps} from "@/components/modals/ModalGuide/ModalManageMaterialGroup/types";
import {PostMaterialGroupOptions} from "@/apiService/apiGuide/types";

const initialData: PostMaterialGroupOptions = {
    name: "",
    description: "",
};

const ModalManageMaterialGroup = (props: ModalManageMaterialGroupProps) => {

    const {
        idMaterialGroup,
        preventClose,
        onClose = () => {},
        ...restProps
    } = props;

    const addSnackbar = useSnackbarStore(state => state.addSnackbar);

    const [savedData, setSavedData] = useState({...initialData});
    const [data, setData] = useState({...initialData});
    const [loading, setLoading] = useState({
        get: true,
        send: false
    });

    const { createController } = useController([]);

    useEffect(() => {
        if (idMaterialGroup === null) {
            mergeState({get: false}, setLoading);
            return;
        }

        const controller = createController();

        ApiService.guide.materialGroup.getById({
            id: idMaterialGroup,
            controller
        }).then(async ({status, data}) => {
            if (status === 'success') {
                const init = {
                    name: data.name,
                    description: data.description ?? '',
                };

                setSavedData(init);
                setData(init);
            } else onClose('error')
        }).finally(() => mergeState({get: false}, setLoading));
    }, [])

    const saveMaterialGroup = async (e: SubmitEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (disabledSave || loading.send) return;

        mergeState({send: true}, setLoading);

        try {
            const { status } = idMaterialGroup === null ? await ApiService.guide.materialGroup.post({
                options: {
                    name: data.name.trim(),
                    description: data.description.trim(),
                }
            }) : await ApiService.guide.materialGroup.patch({
                id: idMaterialGroup,
                options: {
                    name: data.name.trim(),
                    description: data.description.trim(),
                }
            });

            if (status === 'success') {
                addSnackbar({
                    type: 'success',
                    text: `Успешно ${idMaterialGroup === null ? 'добавлено' : 'отредактировано'}: "${data.name}"`
                });

                onClose('updated-data');
            }
        } finally {
            mergeState({send: false}, setLoading);
        }
    }

    const title = useMemo(
        () => `${idMaterialGroup === null ? 'Добавление' : 'Редактирование'} типа изделия`,
        []
    );

    const disabledSave = useMemo(() => {
        const validName = !!data.name.trim();
        const validEdit = validName && (
            data.name.trim() !== savedData.name.trim() ||
            data.description.trim() !== savedData.description.trim()
        );

        return idMaterialGroup === null ? !validName : !validEdit;
    }, [idMaterialGroup, data, savedData]);

    return (
        <ModalPage
            hideCloseButton={loading.send}
            onClose={onClose}
            preventClose={preventClose || loading.send}
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
                        <Button
                            form={'save-type-products'}
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
                <form id={'save-type-products'} className={'modalForm'} onSubmit={saveMaterialGroup}>
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

export default ModalManageMaterialGroup;
