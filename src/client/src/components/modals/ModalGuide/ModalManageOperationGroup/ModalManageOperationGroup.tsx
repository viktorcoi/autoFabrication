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
import styles from './ModalManageOperationGroup.module.scss'
import {mergeState} from "@/shared/helpers";
import {ApiService} from "@/apiService/apiService";
import {useSnackbarStore} from "@/store/snackbar/snackbar";
import {useController} from "@/shared/hooks";
import {ModalManageOperationGroupProps} from "@/components/modals/ModalGuide/ModalManageOperationGroup/types";
import {PostOperationGroupOptions} from "@/apiService/apiGuide/types";

const initialData: PostOperationGroupOptions = {
    name: "",
    description: "",
};

const ModalManageOperationGroup = (props: ModalManageOperationGroupProps) => {

    const {
        idOperationGroup,
        preventClose,
        onLoading,
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
        if (idOperationGroup === null) {
            mergeState({get: false}, setLoading);
            return;
        }

        const controller = createController();

        ApiService.guide.operationGroup.getById({
            id: idOperationGroup,
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

    const saveOperationGroup = async (e: SubmitEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (disabledSave || loading.send) return;

        mergeState({send: true}, setLoading);
        onLoading(true);

        try {
            const { status } = idOperationGroup === null ? await ApiService.guide.operationGroup.post({
                options: {
                    name: data.name.trim(),
                    description: data.description.trim(),
                }
            }) : await ApiService.guide.operationGroup.patch({
                id: idOperationGroup,
                options: {
                    name: data.name.trim(),
                    description: data.description.trim(),
                }
            });

            if (status === 'success') {
                addSnackbar({
                    type: 'success',
                    text: `Успешно ${idOperationGroup === null ? 'добавлено' : 'отредактировано'}: "${data.name}"`
                });

                onClose('updated-data');
            }
        } finally {
            mergeState({send: false}, setLoading);
            onLoading(false);
        }
    }

    const title = useMemo(
        () => `${idOperationGroup === null ? 'Добавление' : 'Редактирование'} группы операций`,
        []
    );

    const disabledSave = useMemo(() => {
        const validName = !!data.name.trim();
        const validEdit = validName && (
            data.name.trim() !== savedData.name.trim() ||
            data.description.trim() !== savedData.description.trim()
        );

        return idOperationGroup === null ? !validName : !validEdit;
    }, [idOperationGroup, data, savedData]);

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
                            form={'save-operation-group'}
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
                <form id={'save-operation-group'} className={'modalForm'} onSubmit={saveOperationGroup}>
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

export default ModalManageOperationGroup;
