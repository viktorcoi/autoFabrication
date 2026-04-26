
import {
    Button,
    ButtonGroup,
    FormItem,
    IconButton,
    ModalPage,
    ModalPageHeader,
    PlatformProvider, Tooltip,
} from "@vkontakte/vkui";
import {autogeneratePassword} from "@/shared/helpers";
import {SubmitEvent, useState} from "react";
import PasswordInput from "@/components/PasswordInput/PasswordInput";
import {ApiService} from "@/apiService/apiService";
import {useSnackbarStore} from "@/store/snackbar/snackbar";
import {Icon20RefreshOutline} from "@vkontakte/icons";
import {ModalChangePasswordProps} from "@/components/modals/ModalChangePassword/types";

const ModalManageUser = (props: ModalChangePasswordProps) => {

    const {
        userId,
        name,
        preventClose,
        onLoading,
        onClose = () => {},
        ...restProps
    } = props;

    const addSnackbar = useSnackbarStore(state => state.addSnackbar);

    const [loading, setLoading] = useState(false);
    const [password, setPassword] = useState('');

    const savePassword = async (e: SubmitEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (password.trim() || loading) return;

        setLoading(true);
        onLoading(true);

        await ApiService.users.patch({
            id: userId,
            options: { password: password }
        }).then(({status, data}) => {
            if (status === 'success') {
                addSnackbar({
                    type: 'success',
                    text: `Пароль для пользователя "${name}" успешно изменен`
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
                            disabled={!password.trim()}
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
                onSubmit={savePassword}
            >
                <FormItem
                    top={'Новый пароль'}
                    noPadding={true}
                >
                    <PasswordInput
                        defaultShow={true}
                        disabled={loading}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder={'Введите новый пароль'}
                        status={!password.trim() ? 'error' : 'default'}
                        after={(
                            <Tooltip
                                description={`Сгенерировать пароль`}
                                usePortal={true}
                                placement={"top"}
                            >
                                <IconButton
                                    label={"Сменить тему"}
                                    onClick={() => setPassword(autogeneratePassword())}
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
