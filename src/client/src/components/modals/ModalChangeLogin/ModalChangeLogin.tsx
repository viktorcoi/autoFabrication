
import {
    Button,
    ButtonGroup,
    FormItem,
    IconButton, Input,
    ModalPage,
    ModalPageHeader,
    PlatformProvider, Tooltip,
} from "@vkontakte/vkui";
import {autogeneratePassword, mergeState} from "@/shared/helpers";
import {SubmitEvent, useEffect, useState} from "react";
import PasswordInput from "@/components/PasswordInput/PasswordInput";
import {ApiService} from "@/apiService/apiService";
import {useSnackbarStore} from "@/store/snackbar/snackbar";
import {Icon20RefreshOutline} from "@vkontakte/icons"
import {useController} from "@/shared/hooks";
import {ModalChangeLoginProps} from "@/components/modals/ModalChangeLogin/types";
import {GetAuthMeResponse} from "@/apiService/apiAuth/types";
import {useAppStore} from "@/store/app/app";

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
