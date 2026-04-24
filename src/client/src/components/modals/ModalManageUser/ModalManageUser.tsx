import {
    Avatar,
    Button,
    ButtonGroup, CustomSelectOptionInterface, DateInput,
    FormItem,
    Input,
    ModalPage,
    ModalPageHeader,
    PlatformProvider, Select, Spinner,
} from "@vkontakte/vkui";
import {SubmitEvent, useEffect, useState} from "react";
import styles from './ModalManageUser.module.scss'
import {mergeState} from "@/shared/helpers";
import {ApiService} from "@/apiService/apiService";
import {PostUserOptions} from "@/apiService/apiUsers/types";
import {ModalManageUserProps} from "@/components/modals/ModalManageUser/types";
import {useController, useSelectFilter} from "@/shared/hooks";
import ModalAddAvatar from "@/components/modals/ModalManageUser/ModalAddAvatar";
import {Icon56UserCircleOutline} from "@vkontakte/icons";
import {OpenModalsType} from "@/components/modals/types";

const initialData: Omit<
    PostUserOptions, 'birthDate' | 'avatarUrl'> & {
    birthDate: Date | null;
    avatarUrl?: string | File;
} = {
    roleId: 0,
    firstName: '',
    lastName: '',
    middleName: '',
    birthDate: null,
};

const getOnlyLettersValue = (value: string) => value.replace(/[^\p{L}]/gu, '');

const ModalManageUser = (props: ModalManageUserProps) => {

    const {
        idUser,
        user,
        preventClose,
        onLoading: _onLoading,
        onCreate,
        onClose = () => {},
        ...restProps
    } = props;

    const [modals, setModals] = useState<OpenModalsType<
        'modal-avatar'
    >>({id: null, show: false, data: null});

    const selectFilter = useSelectFilter();

    const [data, setData] = useState({...initialData});
    const [roles, setRoles] = useState<CustomSelectOptionInterface[]>([]);
    const [avatarFileUrl, setAvatarFileUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState({
        get: true,
        send: false
    });

    const { createController } = useController([]);
    void _onLoading;

    useEffect(() => {
        const controller = createController();

        ApiService.roles.get({
            controller
        }).then(({data, status}) => {
            if (status === 'success') {

                setRoles(data.map(({id, name}) => ({
                    value: id,
                    label: name,
                })))

                if (typeof idUser === 'number') {
                    // TODO - получаем инфу о юзере
                }
            } else onClose('error')
        }).finally(() => mergeState({get: false}, setLoading));
    }, []);

    useEffect(() => {
        if (typeof user === "object" && user !== null) {
            setData(user);
        }
    }, []);

    useEffect(() => {
        if (!(data.avatarUrl instanceof File)) {
            setAvatarFileUrl(null);
            return;
        }

        const nextUrl = URL.createObjectURL(data.avatarUrl);
        setAvatarFileUrl(nextUrl);

        return () => URL.revokeObjectURL(nextUrl);
    }, [data.avatarUrl]);

    const saveUser = async (e: SubmitEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (typeof idUser === 'number') {

        } else {
            onCreate('modal-create-user', data as PostUserOptions);
        }
    //     if (disabledSave) return;
    //
    //     mergeState({send: true}, setLoading);
    //     onLoading(true);
    //
    //     try {
    //         const { status } = idRole === null ? await ApiService.roles.post({
    //             options: {
    //                 name: data.name.trim(),
    //                 description: data.description.trim(),
    //             }
    //         }) : await ApiService.roles.patch({
    //             id: idRole,
    //             options: {
    //                 name: data.name.trim(),
    //                 description: data.description.trim(),
    //             }
    //         });
    //
    //         if (status === 'success') {
    //             addSnackbar({
    //                 type: 'success',
    //                 text: `Успешно ${idRole === null ? 'добавлено' : 'отредактировано'}: "${data.name}"`
    //             });
    //             onClose('updated-data');
    //         }
    //     } finally {
    //         mergeState({send: false}, setLoading);
    //         onLoading(false);
    //     }
    }

    const title = `${typeof idUser === 'number' ? 'Редактирование' : 'Добавление'} пользователя`;
    const disabledSave = false;

    const resetAvatar = () => {
        mergeState({avatarUrl: undefined}, setData);
    };

    const hasAvatar = avatarFileUrl !== null || typeof data.avatarUrl === 'string';
    const avatarSrc = avatarFileUrl ?? (typeof data.avatarUrl === 'string' ? data.avatarUrl : undefined);

    return (
        <>
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
                                form={'save-user'}
                                type={'submit'}
                                disabled={disabledSave || loading.get}
                                loading={loading.send}
                                size={'m'}
                            >
                                {typeof idUser === 'number' ? 'Сохранить' : 'Далее'}
                            </Button>
                        </ButtonGroup>
                    </div>
                )}
                {...restProps}
            >
                {'modal-avatar' === modals.id && (
                    <ModalAddAvatar
                        open={modals.show}
                        onClose={() =>  mergeState({show: false}, setModals)}
                        onClosed={() => setModals({id: null, show: false, data: null})}
                        onAddAvatar={(file) => mergeState({avatarUrl: file}, setData)}
                    />
                )}
                {loading.get ? <Spinner size={'xl'} className={styles.plug}/> : (
                    <form
                        id={'save-user'}
                        className={'modalForm'}
                        onSubmit={saveUser}
                    >
                        <div className={styles.avatar}>
                            <Avatar
                                src={avatarSrc}
                                initials={`${data.firstName[0] ?? ''}${data.lastName[0] ?? ''}`} size={82}
                                fallbackIcon={<Icon56UserCircleOutline />}
                            />
                            <ButtonGroup
                                gap={'s'}
                                mode={'vertical'}
                            >
                                <Button
                                    type={'button'}
                                    mode={'secondary'}
                                    size={'m'}
                                    stretched={true}
                                    onClick={() => mergeState({id: 'modal-avatar', show: true}, setModals)}
                                >
                                    {`${hasAvatar ? 'Изменить' : 'Добавить' } аватар`}
                                </Button>
                                {hasAvatar && (
                                    <Button
                                        type={'button'}
                                        mode={'secondary'}
                                        appearance={'negative'}
                                        size={'m'}
                                        stretched={true}
                                        onClick={resetAvatar}
                                    >
                                        Удалить аватар
                                    </Button>
                                )}
                            </ButtonGroup>
                        </div>
                        <FormItem
                            top={'Роль пользователя'}
                            noPadding={true}
                        >
                            <Select
                                filterFn={selectFilter.filterFn}
                                options={roles}
                                searchable={true}
                                disabled={loading.send}
                                value={data.roleId}
                                onChange={(e) => mergeState({roleId: Number(e.target.value)}, setData)}
                                placeholder={'Выберите роль пользователя'}
                                status={!data.roleId ? 'error' : 'default'}
                                onInputChange={selectFilter.onInputChange}
                                onOpen={selectFilter.onOpen}
                                onClose={selectFilter.onClose}
                            />
                        </FormItem>
                        <FormItem
                            top={'Фамилия'}
                            noPadding={true}
                        >
                            <Input
                                disabled={loading.send}
                                value={data.lastName}
                                onChange={(e) => mergeState({lastName: getOnlyLettersValue(e.target.value)}, setData)}
                                placeholder={'Введите фамилию'}
                                status={!data.lastName.trim() ? 'error' : 'default'}
                            />
                        </FormItem>
                        <FormItem
                            top={'Имя'}
                            noPadding={true}
                        >
                            <Input
                                disabled={loading.send}
                                value={data.firstName}
                                onChange={(e) => mergeState({firstName: getOnlyLettersValue(e.target.value)}, setData)}
                                placeholder={'Введите имя'}
                                status={!data.firstName.trim() ? 'error' : 'default'}
                            />
                        </FormItem>
                        <FormItem
                            top={'Отчество'}
                            noPadding={true}
                        >
                            <Input
                                disabled={loading.send}
                                value={data.middleName}
                                onChange={(e) => mergeState({middleName: getOnlyLettersValue(e.target.value)}, setData)}
                                placeholder={'Введите отчество'}
                            />
                        </FormItem>
                        <FormItem
                            top={'Дата рождения'}
                            noPadding={true}
                        >
                            <DateInput
                                disableFuture={true}
                                value={data.birthDate}
                                onChange={value => mergeState({birthDate: value}, setData)}
                                status={data.birthDate === null ? 'error' : 'default'}
                            />
                        </FormItem>
                    </form>
                )}
            </ModalPage>
        </>
    )
};

export default ModalManageUser;
