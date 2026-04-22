import {
    Button,
    ButtonGroup, CustomSelectOptionInterface, DateInput,
    FormItem,
    Input,
    ModalPage,
    ModalPageHeader,
    PlatformProvider, Select, Spinner,
} from "@vkontakte/vkui";
import {SubmitEvent, useEffect, useMemo, useRef, useState} from "react";
import styles from './ModalManageUser.module.scss'
import {mergeState} from "@/shared/helpers";
import {ApiService} from "@/apiService/apiService";
import {useSnackbarStore} from "@/store/snackbar/snackbar";
import {PostUserOptions} from "@/apiService/apiUsers/types";
import {ModalManageUserProps} from "@/components/modals/ModalManageUser/types";
import {useSelectFilter} from "@/shared/hooks";

const initialData: Omit<PostUserOptions, 'birthDate'> & {birthDate: Date | null} = {
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
        onLoading,
        onCreate,
        onClose = () => {},
        ...restProps
    } = props;

    const addSnackbar = useSnackbarStore(state => state.addSnackbar);

    const selectFilter = useSelectFilter();

    const [savedData, setSavedData] = useState({...initialData});
    const [data, setData] = useState({...initialData});
    const [roles, setRoles] = useState<CustomSelectOptionInterface[]>([]);
    const [loading, setLoading] = useState({
        get: true,
        send: false
    });

    const controllerRef = useRef<AbortController>(null);

    useEffect(() => {
        const controller = new AbortController();
        controllerRef.current = controller;

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

        return () => {
            if (controllerRef.current) controllerRef.current.abort();
        }
    }, []);

    useEffect(() => {
        if (typeof user === "object" && user !== null) {
            setData(user);
        }
    }, []);

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

    const title = useMemo(
        () =>  `${typeof idUser === 'number' ? 'Редактирование' : 'Добавление'} пользователя`,
        []
    );

    const disabledSave = useMemo(() => {
        // const validName = !!data.name.trim();
        // const validEdit = validName && (
        //     data.name.trim() !== savedData.name.trim() ||
        //     data.description.trim() !== savedData.description.trim()
        // );
        //
        // return idRole === null ? !validName : !validEdit;
        return false;
    }, [idUser, data, savedData]);

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
            {loading.get ? <Spinner size={'xl'} className={styles.plug}/> : (
                <form
                    id={'save-user'}
                    className={'modalForm'}
                    onSubmit={saveUser}
                >
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
    )
};

export default ModalManageUser;
