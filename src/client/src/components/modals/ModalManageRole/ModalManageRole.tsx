import {ModalManageRoleProps} from "@/components/modals/ModalManageRole/types";
import {
    Button,
    ButtonGroup,
    FormItem,
    Input,
    ModalPage,
    ModalPageHeader,
    PlatformProvider,
    Textarea
} from "@vkontakte/vkui";
import {useMemo, useState} from "react";
import styles from './ModalManageRole.module.scss'
import {mergeState} from "@/helpers";
import {ApiService} from "@/apiService/apiService";
import {useSnackbarStore} from "@/store/snackbar/snackbar";

const ModalManageRole = (props: ModalManageRoleProps) => {

    const {
        idRole,
        preventClose,
        onLoading,
        onClose = () => {},
        ...restProps
    } = props;

    const addSnackbar = useSnackbarStore(state => state.addSnackbar)

    const [data, setData] = useState({
        name: '',
        description: '',
    });
    const [loading, setLoading] = useState({
        get: true,
        send: false
    });

    const saveRole = async () => {
        mergeState({send: true}, setLoading);
        onLoading(true);

        await ApiService.roles.post({
            options: {
                name: data.name.trim(),
                description: data.description.trim(),
            }
        }).then(({data, status}) => {
            if (status === 'success') {
                console.log('success');
                addSnackbar({
                    type: 'success',
                    text: `Роль "${data.name}" успешно ${idRole === null ? 'добавлена' : 'отредактирована'}`
                })
                onClose('updated-data')
            }
        }).finally(() => {
            mergeState({send: false}, setLoading);
            onLoading(false);
        })
    }

    const title = useMemo(() => idRole === null ? 'Добавление роли' : 'Редактирование роли', [])

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
                            disabled={!data.name.trim()}
                            loading={loading.send}
                            size={'m'}
                            onClick={saveRole}
                        >
                            Сохранить
                        </Button>
                    </ButtonGroup>
                </div>
            )}
            {...restProps}
        >
            <form className={'modalForm'}>
                <FormItem
                    top={'Название'}
                    noPadding={true}
                >
                    <Input
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
                        value={data.description}
                        onChange={(e) => mergeState({description: e.target.value}, setData)}
                        className={styles.textarea}
                        placeholder={'Введите описание'}
                    />
                </FormItem>
            </form>
        </ModalPage>
    )
};

export default ModalManageRole;
