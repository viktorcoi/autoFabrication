import {
    Avatar,
    Button,
    ButtonGroup, CustomSelectOptionInterface, DateInput,
    FormItem,
    Input,
    ModalPage,
    ModalPageHeader,
    PlatformProvider, Select, Slider, Spinner,
} from "@vkontakte/vkui";
import {SubmitEvent, useEffect, useMemo, useState} from "react";
import Cropper, {type Area, type Point} from "react-easy-crop";
import styles from './ModalManageUser.module.scss'
import {mergeState} from "@/shared/helpers";
import {ApiService} from "@/apiService/apiService";
import {useSnackbarStore} from "@/store/snackbar/snackbar";
import {PostUserOptions} from "@/apiService/apiUsers/types";
import {ModalManageUserProps} from "@/components/modals/ModalManageUser/types";
import {useController, useSelectFilter} from "@/shared/hooks";
import DragAndDropFile from "@/components/DragAndDropFile/DragAndDropFile";

const AVATAR_OUTPUT_SIZE = 512;

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

const createImage = (url: string) => new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();

    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Не удалось прочитать изображение'));
    image.src = url;
});

const getCroppedAvatarName = (fileName: string) => {
    const nameWithoutExtension = fileName.replace(/\.[^/.]+$/, '');

    return `${nameWithoutExtension || 'avatar'}-cropped.png`;
};

const getCroppedAvatarFile = async (
    imageSrc: string,
    crop: Area,
    fileName: string,
) => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    if (!context) {
        throw new Error('Не удалось подготовить изображение');
    }

    canvas.width = AVATAR_OUTPUT_SIZE;
    canvas.height = AVATAR_OUTPUT_SIZE;

    context.drawImage(
        image,
        crop.x,
        crop.y,
        crop.width,
        crop.height,
        0,
        0,
        AVATAR_OUTPUT_SIZE,
        AVATAR_OUTPUT_SIZE,
    );

    const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((nextBlob) => {
            if (nextBlob) {
                resolve(nextBlob);
                return;
            }

            reject(new Error('Не удалось обрезать изображение'));
        }, 'image/png');
    });

    return new File([blob], getCroppedAvatarName(fileName), {
        type: 'image/png',
        lastModified: Date.now(),
    });
};

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
    const [avatarFileUrl, setAvatarFileUrl] = useState<string | null>(null);
    const [avatarCrop, setAvatarCrop] = useState<Point>({x: 0, y: 0});
    const [avatarZoom, setAvatarZoom] = useState(1);
    const [avatarCropArea, setAvatarCropArea] = useState<Area | null>(null);
    const [avatarCropLoading, setAvatarCropLoading] = useState(false);
    const [loading, setLoading] = useState({
        get: true,
        send: false
    });

    const { createController } = useController([]);

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

    useEffect(() => {
        if (data.avatarUrl instanceof File) {
            setAvatarCrop({x: 0, y: 0});
            setAvatarZoom(1);
            setAvatarCropArea(null);
        }
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

    const setAvatarFile = (files: File[]) => {
        const [file] = files;

        if (!file) return;

        if (!file.type.startsWith('image/')) {
            addSnackbar({
                type: 'error',
                text: 'Выберите изображение',
            });
            return;
        }

        mergeState({avatarUrl: file}, setData);
    };

    const resetAvatar = () => {
        mergeState({avatarUrl: undefined}, setData);
    };

    const applyAvatarCrop = async () => {
        if (!(data.avatarUrl instanceof File) || !avatarFileUrl || !avatarCropArea || avatarCropLoading) {
            return;
        }

        setAvatarCropLoading(true);

        try {
            const croppedFile = await getCroppedAvatarFile(
                avatarFileUrl,
                avatarCropArea,
                data.avatarUrl.name,
            );

            mergeState({avatarUrl: croppedFile}, setData);
            addSnackbar({
                type: 'success',
                text: 'Аватар обрезан',
            });
        } catch (error) {
            addSnackbar({
                type: 'error',
                text: error instanceof Error ? error.message : 'Не удалось обрезать аватар',
            });
        } finally {
            setAvatarCropLoading(false);
        }
    };

    const renderAvatarControl = () => {
        if (typeof data.avatarUrl === 'string' && data.avatarUrl) {
            return (
                <div className={styles.avatarPreview}>
                    <Avatar
                        size={96}
                        src={data.avatarUrl}
                    />
                    <ButtonGroup>
                        <Button
                            type={'button'}
                            size={'s'}
                            mode={'secondary'}
                            onClick={resetAvatar}
                        >
                            Заменить
                        </Button>
                        <Button
                            type={'button'}
                            size={'s'}
                            mode={'tertiary'}
                            onClick={resetAvatar}
                        >
                            Удалить
                        </Button>
                    </ButtonGroup>
                </div>
            );
        }

        if (data.avatarUrl instanceof File) {
            return (
                <div className={styles.avatarCrop}>
                    <div className={styles.cropper}>
                        {avatarFileUrl ? (
                            <Cropper
                                image={avatarFileUrl}
                                crop={avatarCrop}
                                zoom={avatarZoom}
                                rotation={0}
                                aspect={1}
                                minZoom={1}
                                maxZoom={3}
                                cropShape={'round'}
                                showGrid={false}
                                onCropChange={setAvatarCrop}
                                onZoomChange={setAvatarZoom}
                                onCropComplete={(_, croppedAreaPixels) => setAvatarCropArea(croppedAreaPixels)}
                            />
                        ) : (
                            <Spinner size={'m'}/>
                        )}
                    </div>
                    <FormItem
                        top={'Масштаб'}
                        noPadding={true}
                    >
                        <Slider
                            min={1}
                            max={3}
                            step={0.05}
                            value={avatarZoom}
                            onChange={(value) => setAvatarZoom(value)}
                        />
                    </FormItem>
                    <ButtonGroup
                        stretched={true}
                        align={'right'}
                    >
                        <Button
                            type={'button'}
                            size={'s'}
                            mode={'secondary'}
                            disabled={avatarCropLoading}
                            onClick={resetAvatar}
                        >
                            Выбрать другое
                        </Button>
                        <Button
                            type={'button'}
                            size={'s'}
                            disabled={!avatarCropArea}
                            loading={avatarCropLoading}
                            onClick={applyAvatarCrop}
                        >
                            Применить
                        </Button>
                    </ButtonGroup>
                </div>
            );
        }

        return (
            <DragAndDropFile
                title={'Выберите аватар'}
                maxFiles={1}
                maxSize={5}
                accept={'image/*'}
                showFileList={false}
                description={'Можно выбрать аватар через проводник или перетащить его в эту область (максимум 5 MB)'}
                onChange={setAvatarFile}
                onError={error => addSnackbar({type: 'error', text: error.message})}
            />
        );
    };

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
                    {renderAvatarControl()}
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
