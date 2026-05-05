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
import styles from './ModalManageTypeProducts.module.scss'
import {mergeState} from "@/shared/helpers";
import {ApiService} from "@/apiService/apiService";
import {useSnackbarStore} from "@/store/snackbar/snackbar";
import {useController} from "@/shared/hooks";
import {ModalManageTypeProductsProps} from "@/components/modals/ModalGuide/ModalManageTypeProducts/types";
import {PostTypeProductsOptions} from "@/apiService/apiGuide/types";

const initialData: PostTypeProductsOptions = {
    name: "",
    description: "",
};

const ModalManageTypeProducts = (props: ModalManageTypeProductsProps) => {

    const {
        idTypeProducts,
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
        if (idTypeProducts === null) {
            mergeState({get: false}, setLoading);
            return;
        }

        const controller = createController();

        ApiService.guide.typeProducts.getById({
            id: idTypeProducts,
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

    const saveTypeProducts = async (e: SubmitEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (disabledSave || loading.send) return;

        mergeState({send: true}, setLoading);

        try {
            const { status } = idTypeProducts === null ? await ApiService.guide.typeProducts.post({
                options: {
                    name: data.name.trim(),
                    description: data.description.trim(),
                }
            }) : await ApiService.guide.typeProducts.patch({
                id: idTypeProducts,
                options: {
                    name: data.name.trim(),
                    description: data.description.trim(),
                }
            });

            if (status === 'success') {
                addSnackbar({
                    type: 'success',
                    text: `Успешно ${idTypeProducts === null ? 'добавлено' : 'отредактировано'}: "${data.name}"`
                });

                onClose('updated-data');
            }
        } finally {
            mergeState({send: false}, setLoading);
        }
    }

    const title = useMemo(
        () => `${idTypeProducts === null ? 'Добавление' : 'Редактирование'} типа изделия`,
        []
    );

    const disabledSave = useMemo(() => {
        const validName = !!data.name.trim();
        const validEdit = validName && (
            data.name.trim() !== savedData.name.trim() ||
            data.description.trim() !== savedData.description.trim()
        );

        return idTypeProducts === null ? !validName : !validEdit;
    }, [idTypeProducts, data, savedData]);

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
                <form id={'save-type-products'} className={'modalForm'} onSubmit={saveTypeProducts}>
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

export default ModalManageTypeProducts;
