import {ModalCreateUserProps} from "@/components/modals/ModalCreateUser/types";
import {
    Button,
    ButtonGroup,
    FormItem, IconButton, Input,
    ModalPage,
    ModalPageHeader, PanelHeaderButton,
    PlatformProvider, Tooltip,
} from "@vkontakte/vkui";
import {autogeneratePassword, mergeState} from "@/shared/helpers";
import {SubmitEvent, useEffect, useState} from "react";
import PasswordInput from "@/components/PasswordInput/PasswordInput";
import {autogenerateLogin} from "@/components/modals/ModalCreateUser/helpers";
import {ApiService} from "@/apiService/apiService";
import {useSnackbarStore} from "@/store/snackbar/snackbar";
import {Icon20RefreshOutline, Icon24Back} from "@vkontakte/icons";

const LOGIN_PATTERN = /^[\x21-\x7E]+$/;

const ModalManageUser = (props: ModalCreateUserProps) => {

    const {
        user,
        preventClose,
        onBack,
        onLoading,
        onClose = () => {},
        ...restProps
    } = props;

    const addSnackbar = useSnackbarStore(state => state.addSnackbar);

    const [loading, setLoading] = useState(false);
    const [data, setData] = useState({
        login: '',
        password: '',
    });

    useEffect(() => {
        setData({
            login: autogenerateLogin(user),
            password: autogeneratePassword(),
        })
    }, [])

    const saveUser = async (e: SubmitEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!data.login.trim() || !data.password.trim() || loading) return;

        if (data.login.length < 5) {
            addSnackbar({
                type: "error",
                text: "Логин должен содержать не менее 5 латинских символов.",
            });
            return;
        }

        if (!LOGIN_PATTERN.test(data.login)) {
            addSnackbar({
                type: "error",
                text: "Логин может содержать только латинские буквы, цифры и специальные символы.",
            });
            return;
        }

        if (data.password.length < 6) {
            addSnackbar({
                type: "error",
                text: "Пароль должен содержать не менее 6 символов.",
            });
            return;
        }

        setLoading(true);
        onLoading(true);

        await ApiService.users.post({
            options: {
                ...user,
                login: data.login,
                password: data.password
            }
        }).then(({status, data}) => {
            if (status === 'success') {
                addSnackbar({
                    type: 'success',
                    text: `Успешно добавлено ${data.login}`
                });
                onClose('updated-data');
            }
        }).finally(() => {
            setLoading(false);
            onLoading(false);
        })
    };

    return (
        <ModalPage
            hideCloseButton={loading}
            onClose={onClose}
            preventClose={preventClose}
            header={
                <PlatformProvider
                    value={'ios'}
                >
                    <ModalPageHeader
                        before={(
                            <PanelHeaderButton
                                aria-label={'Назад'}
                                onClick={() => onBack('modal-manage-user')}
                            >
                                <Icon24Back/>
                            </PanelHeaderButton>
                        )}
                    >
                        Добавление пользователя
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
                            disabled={loading}
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
                            disabled={!data.login.trim() || !data.password.trim()}
                            loading={loading}
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
                onSubmit={saveUser}
            >
                <FormItem
                    top={'Логин'}
                    noPadding={true}
                >
                    <Input
                        disabled={loading}
                        value={data.login}
                        onChange={(e) => mergeState({login: e.target.value}, setData)}
                        placeholder={'Введите логин'}
                        status={!data.login.trim() ? 'error' : 'default'}
                        maxLength={35}
                    />
                </FormItem>
                <FormItem
                    top={'Пароль'}
                    noPadding={true}
                >
                    <PasswordInput
                        defaultShow={true}
                        disabled={loading}
                        value={data.password}
                        onChange={(e) => mergeState({password: e.target.value}, setData)}
                        placeholder={'Введите пароль'}
                        status={!data.password.trim() ? 'error' : 'default'}
                        maxLength={15}
                        after={(
                            <Tooltip
                                description={`Сгенерировать пароль`}
                                usePortal={true}
                                placement={"top"}
                                disableTriggerOnFocus={true}
                            >
                                <IconButton
                                    label={"Сгенерировать пароль"}
                                    onClick={() => mergeState({password: autogeneratePassword()}, setData)}
                                >
                                    <Icon20RefreshOutline/>
                                </IconButton>
                            </Tooltip>
                        )}
                    />
                </FormItem>
            </form>
        </ModalPage>
    )
};

export default ModalManageUser;
