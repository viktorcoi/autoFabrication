
import {
    Button,
    ButtonGroup,
    FormItem,
    Input,
    ModalPage,
    ModalPageHeader,
    PlatformProvider,
} from "@vkontakte/vkui";
import {mergeState} from "@/shared/helpers";
import {SubmitEvent, useEffect, useState} from "react";
import {ApiService} from "@/apiService/apiService";
import {useSnackbarStore} from "@/store/snackbar/snackbar";
import {useController} from "@/shared/hooks";
import {ModalChangeLoginProps} from "@/components/modals/ModalChangeLogin/types";
import {GetAuthMeResponse} from "@/apiService/apiAuth/types";
import {useAppStore} from "@/store/app/app";

const LOGIN_PATTERN = /^[\x21-\x7E]+$/;

const ModalManageUser = (props: ModalChangeLoginProps) => {

    const {
        userId,
        name,
        preventClose,
        onLoading,
        onClose = () => {},
        ...restProps
    } = props;

    const { user: currentUser, setUser } = useAppStore(state => state);
    const addSnackbar = useSnackbarStore(state => state.addSnackbar);
    const { createController } = useController([]);

    const [loading, setLoading] = useState({
        get: true,
        send: false
    });
    const [login, setLogin] = useState('');

    useEffect(() => {
        const controller = createController();

        if (userId) {
            ApiService.users.getById({
                id: userId,
                controller
            }).then(({status, data}) => {
                if (status === 'success') {
                    setLogin(data.login);
                } else onClose('error')
            }).finally(() => mergeState({get: false}, setLoading));
        }
    }, []);

    const saveLogin = async (e: SubmitEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!login.trim() || loading.send) return;

        if (login.length < 5) {
            addSnackbar({
                type: "error",
                text: "Логин должен содержать не менее 5 латинских символов.",
            });
            return;
        }

        if (!LOGIN_PATTERN.test(login)) {
            addSnackbar({
                type: "error",
                text: "Логин может содержать только латинские буквы, цифры и специальные символы.",
            });
            return;
        }

        mergeState({send: true}, setLoading);
        onLoading(true);

        await ApiService.users.patch({
            id: userId,
            options: { login }
        }).then(({status, data}) => {
            if (status === 'success') {
                addSnackbar({
                    type: 'success',
                    text: `Логин для пользователя "${name}" успешно изменен`
                });
                if (currentUser?.id === data.id) {
                    setUser({...currentUser, ...data} as GetAuthMeResponse);
                }
                onClose('updated-data');
            }
        }).finally(() => {
            mergeState({send: false}, setLoading);
            onLoading(false);
        })
    };

    return (
        <ModalPage
            hideCloseButton={loading.send}
            onClose={onClose}
            preventClose={preventClose}
            header={
                <PlatformProvider
                    value={'ios'}
                >
                    <ModalPageHeader>
                        Изменить логин
                    </ModalPageHeader>
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
                            form={'save-user'}
                            type={'submit'}
                            disabled={!login.trim() || loading.get}
                            loading={loading.send}
                            size={'m'}
                        >
                            {'Сохранить'}
                        </Button>
                    </ButtonGroup>
                </div>
            )}
            {...restProps}
        >
            <form
                id={'save-user'}
                className={'modalForm'}
                onSubmit={saveLogin}
            >
                <FormItem
                    top={'Новый логин'}
                    noPadding={true}
                >
                    <Input
                        disabled={loading.send}
                        value={login}
                        onChange={(e) => setLogin(e.target.value)}
                        placeholder={'Введите новый логин'}
                        status={!login ? 'error' : 'default'}
                    />
                </FormItem>
            </form>
        </ModalPage>
    )
};

export default ModalManageUser;
