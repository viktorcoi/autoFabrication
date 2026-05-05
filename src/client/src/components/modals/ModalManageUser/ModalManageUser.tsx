import {
    Avatar,
    Button,
    ButtonGroup, classNames,
    CustomSelectOptionInterface,
    DateInput,
    FormItem,
    Input,
    ModalPage,
    ModalPageHeader,
    PlatformProvider,
    Select,
    Spinner
} from "@vkontakte/vkui";
import {SubmitEvent, useEffect, useMemo, useState} from "react";
import styles from './ModalManageUser.module.scss'
import {mergeState} from "@/shared/helpers";
import {ApiService} from "@/apiService/apiService";
import {PathUserOptions, PostUserOptions} from "@/apiService/apiUsers/types";
import {ModalManageUserProps, PostUserType} from "@/components/modals/ModalManageUser/types";
import {useController, useSelectFilter} from "@/shared/hooks";
import ModalAddAvatar from "@/components/modals/ModalAddAvatar/ModalAddAvatar";
import {Icon24View, Icon56UserCircleOutline} from "@vkontakte/icons";
import {OpenModalsType} from "@/components/modals/types";
import {useSnackbarStore} from "@/store/snackbar/snackbar";
import {PhotoView} from "react-photo-view";
import ImagesProvider from "@/components/ImagesProvider/ImagesProvider";
import {useAppStore} from "@/store/app/app";

const initialData: PostUserType = {
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
        onCreate,
        onClose = () => {},
        ...restProps
    } = props;

    const [modals, setModals] = useState<OpenModalsType<
        'modal-avatar'
    >>({id: null, show: false, data: null});
    const [savedData, setSavedData] = useState({...initialData});
    const [data, setData] = useState({...initialData});
    const [roles, setRoles] = useState<CustomSelectOptionInterface[]>([]);
    const [avatarFileUrl, setAvatarFileUrl] = useState<string | null>(null);
    const [openAvatar, setOpenAvatar] = useState(false);
    const [loading, setLoading] = useState({
        get: true,
        send: false
    });

    const selectFilter = useSelectFilter();
    const { user: currentUser, getUser } = useAppStore(state => state);
    const addSnackbar = useSnackbarStore(state => state.addSnackbar);
    const { createController } = useController([]);

    useEffect(() => {
        const controller = createController();

        ApiService.roles.get({
            controller,
            options: { forSelect: true, sorting: {id: 'name', sort: 'asc'}},
        }).then(async ({data, status}) => {
            if (status === 'success') {

                setRoles(data.map(({id, name}) => ({
                    value: id,
                    label: name,
                })))

                if (typeof idUser === 'number') {
                    await ApiService.users.getById({
                        id: idUser,
                        controller
                    }).then(({status, data}) => {
                        if (status === 'success') {
                            const user = {
                                roleId: data.roleId,
                                firstName: data.firstName,
                                lastName: data.lastName,
                                middleName: data.middleName ?? '',
                                birthDate: new Date(data.birthDate),
                                avatarUrl: data.avatarUrl,
                            }

                            setSavedData(user);
                            setData(user);
                        } else onClose('error')
                    });
                } else if (typeof user === "object" && user !== null) {
                    setData(user);
                }
            } else onClose('error')
        }).finally(() => mergeState({get: false}, setLoading));
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
        if (disabledSave || loading.send) return;

        if (typeof idUser === 'number') {
            mergeState({send: true}, setLoading);

            let options = {...data};

            Object.keys(data).forEach((key) => {
                const value = options[key as keyof PostUserType];
                const savedValue = savedData[key as keyof PostUserType];

                if ((typeof value === 'string' && typeof savedValue === 'string') && (
                    value.trim() === savedValue.trim()
                )) {
                    delete options[key as keyof PostUserType];
                } else if (value === savedValue) {
                    delete options[key as keyof PostUserType];
                }
            });

            await ApiService.users.patch({
                id: idUser,
                options: options as PathUserOptions,
            }).then(async ({status, data}) => {
                if (status === 'success') {
                    addSnackbar({
                        type: 'success',
                        text: `Успешно сохранено ${data.login}`
                    });
                    if (currentUser?.id === data.id) {
                        await getUser();
                    }
                    onClose('updated-data');
                }
            }).finally(() => mergeState({send: false}, setLoading));
        } else {
            onCreate('modal-create-user', data as PostUserOptions);
        }
    };

    const title = useMemo(
        () =>  `${typeof idUser === 'number' ? 'Редактирование' : 'Добавление'} пользователя`,
        []
    );

    const avatarSrc = useMemo(
        () => avatarFileUrl ?? (typeof data.avatarUrl === 'string' ? data.avatarUrl : undefined),
        [avatarFileUrl, data.avatarUrl]
    );

    const disabledSave = useMemo(() => {
        const validRequired = !!data.firstName.trim() && !!data.lastName.trim() && data.roleId && data.birthDate;

        const validEdit = validRequired && (
            data.firstName.trim() !== savedData.firstName.trim() ||
            data.lastName.trim() !== savedData.lastName.trim() ||
            data.middleName?.trim() !== savedData.middleName?.trim() ||
            data.roleId !== savedData.roleId ||
            data.birthDate !== savedData.birthDate ||
            data.avatarUrl !== savedData.avatarUrl
        );

        return typeof idUser === "number" ? !validEdit : !validRequired;
    }, [idUser, data, savedData]);

    return (
        <ModalPage
            height={604}
            hideCloseButton={loading.send}
            onClose={onClose}
            preventClose={preventClose || loading.send || openAvatar || modals.id !== null}
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
                        {avatarSrc ? (
                            <ImagesProvider onVisibleChange={setOpenAvatar}>
                                <PhotoView src={avatarSrc}>
                                    <Avatar
                                        src={avatarSrc}
                                        initials={`${data.firstName[0] ?? ''}${data.lastName[0] ?? ''}`}
                                        size={88}
                                        fallbackIcon={<Icon56UserCircleOutline />}
                                    >
                                        <Avatar.Overlay theme="dark" visibility="on-hover">
                                            <Icon24View />
                                        </Avatar.Overlay>
                                    </Avatar>
                                </PhotoView>
                            </ImagesProvider>
                        ) : (
                            <Avatar
                                src={avatarSrc}
                                initials={`${data.firstName[0] ?? ''}${data.lastName[0] ?? ''}`}
                                size={88}
                                fallbackIcon={<Icon56UserCircleOutline />}
                            />
                        )}
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
                                {`${avatarSrc ? 'Изменить' : 'Добавить' } аватар`}
                            </Button>
                            {avatarSrc && (
                                <Button
                                    type={'button'}
                                    mode={'secondary'}
                                    appearance={'negative'}
                                    size={'m'}
                                    stretched={true}
                                    onClick={() => mergeState({avatarUrl: null}, setData)}
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
                            className={classNames(loading.send && 'disabled')}
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
                            maxLength={20}
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
                            maxLength={20}
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
                            maxLength={20}
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
    )
};

export default ModalManageUser;
