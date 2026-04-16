import {ModalManageRoleProps} from "@/components/modals/ModalManageRole/types";
import {
    Button,
    ButtonGroup,
    FormItem,
    Input,
    ModalPage,
    ModalPageHeader, PanelSpinner,
    PlatformProvider,
    Textarea
} from "@vkontakte/vkui";
import {SubmitEvent, useEffect, useMemo, useRef, useState} from "react";
import styles from './ModalManageRole.module.scss'
import {mergeState} from "@/helpers";
import {ApiService} from "@/apiService/apiService";
import {useSnackbarStore} from "@/store/snackbar/snackbar";

const initialData = {
    name: "",
    description: "",
};

const ModalManageRole = (props: ModalManageRoleProps) => {

    const {
        idRole,
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

    const controllerRef = useRef<AbortController>(null);

    useEffect(() => {
        if (idRole === null) {
            mergeState({get: false}, setLoading);
            return;
        }

        const controller = new AbortController();
        controllerRef.current = controller;

        mergeState({get: true}, setLoading);

        ApiService.roles.getById({
            id: idRole,
            controller
        }).then(({status, data}) => {
            if (status === 'success') {
                const init = {
                    name: data.name,
                    description: data.description,
                };

                setSavedData(init);
                setData(init);
            } else onClose('error')
        }).finally(() => mergeState({get: false}, setLoading));


        return () => {
            if (controllerRef.current) controllerRef.current.abort();
        }
    }, [])

    const saveRole = async (e: SubmitEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (disabledSave) return;

        mergeState({send: true}, setLoading);
        onLoading(true);

        try {
            const { status } = idRole === null ? await ApiService.roles.post({
                options: {
                    name: data.name.trim(),
                    description: data.description.trim(),
                }
            }) : await ApiService.roles.patch({
                id: idRole,
                options: {
                    name: data.name.trim(),
                    description: data.description.trim(),
                }
            });

            if (status === 'success') {
                addSnackbar({
                    type: 'success',
                    text: `Успешно ${idRole === null ? 'добавлено' : 'отредактировано'}: "${data.name}"`
                });
                onClose('updated-data');
            }
        } finally {
            mergeState({send: false}, setLoading);
            onLoading(false);
        }
    }

    const title = useMemo(
        () => idRole === null ? 'Добавление роли' : 'Редактирование роли',
        []
    );

    const disabledSave = useMemo(() => {
        const validName = !!data.name.trim();
        const validEdit = validName && (
            data.name.trim() !== savedData.name.trim() ||
            data.description.trim() !== savedData.description.trim()
        );

        return idRole === null ? !validName : !validEdit;
    }, [idRole, data, savedData]);

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
                            form={'save-role'}
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
            {loading.get ? <PanelSpinner size={'xl'} className={styles.plug}/> : (
                <form id={'save-role'} className={'modalForm'} onSubmit={saveRole}>
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
                        />
                    </FormItem>
                    <FormItem
                        top={'Описание'}
                        noPadding={true}
                    >
                        <Textarea
                            disabled={loading.send}
                            value={data.description}
                            onChange={(e) => mergeState({description: e.target.value}, setData)}
                            className={styles.textarea}
                            placeholder={'Введите описание'}
                        />
                    </FormItem>
                </form>
            )}
        </ModalPage>
    )
};

export default ModalManageRole;
