import {
    Button,
    ButtonGroup,
    ModalPage,
    ModalPageHeader,
    PlatformProvider,
    Spinner, Tooltip,
} from "@vkontakte/vkui";
import {type ChangeEvent, useEffect, useRef, useState} from "react";
import Cropper, {type Area, type Point} from "react-easy-crop";
import {useSnackbarStore} from "@/store/snackbar/snackbar";
import styles from "./ModalAddAvatar.module.scss";
import {ModalAddAvatarProps} from "@/components/modals/ModalAddAvatar/types";
import {getCroppedAvatarFile} from "@/components/modals/ModalAddAvatar/helpers";
import UploadFile from "@/components/UploadFile/UploadFile";
import {
    Icon16Delete,
    Icon16Pen,
    Icon56UserAddBadgeOutline
} from "@vkontakte/icons";

const ModalAddAvatar = (props: ModalAddAvatarProps) => {

    const {
        onClose,
        onAddAvatar,
        hideCloseButton,
        preventClose,
        ...restProps
    } = props;

    const addSnackbar = useSnackbarStore(state => state.addSnackbar);
    const replacementInputRef = useRef<HTMLInputElement | null>(null);

    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [avatarFileUrl, setAvatarFileUrl] = useState<string | null>(null);
    const [avatarCrop, setAvatarCrop] = useState<Point>({x: 0, y: 0});
    const [avatarZoom, setAvatarZoom] = useState(1);
    const [avatarCropArea, setAvatarCropArea] = useState<Area | null>(null);
    const [avatarCropLoading, setAvatarCropLoading] = useState(false);

    useEffect(() => {
        if (!avatarFile) {
            setAvatarFileUrl(null);
            return;
        }

        const nextUrl = URL.createObjectURL(avatarFile);
        setAvatarFileUrl(nextUrl);

        return () => URL.revokeObjectURL(nextUrl);
    }, [avatarFile]);

    useEffect(() => {
        if (!avatarFile) {
            return;
        }

        setAvatarCrop({x: 0, y: 0});
        setAvatarZoom(1);
        setAvatarCropArea(null);
    }, [avatarFile]);

    const setNextAvatarFile = (file?: File) => {
        if (!file) {
            return;
        }

        if (!file.type.startsWith('image/')) {
            addSnackbar({
                type: 'error',
                text: 'Выберите изображение',
            });
            return;
        }

        setAvatarFile(file);
    };

    const openReplacementDialog = () => {
        if (avatarCropLoading) {
            return;
        }

        replacementInputRef.current?.click();
    };

    const handleReplacementChange = (event: ChangeEvent<HTMLInputElement>) => {
        setNextAvatarFile(Array.from(event.target.files ?? [])[0]);
        event.target.value = '';
    };

    const applyAvatarCrop = async () => {
        if (!avatarFile || !avatarFileUrl || !avatarCropArea || avatarCropLoading) {
            return;
        }

        setAvatarCropLoading(true);

        try {
            const croppedFile = await getCroppedAvatarFile(
                avatarFileUrl,
                avatarCropArea,
                avatarFile.name,
            );

            onAddAvatar(croppedFile);
            onClose();
        } catch (error) {
            addSnackbar({
                type: 'error',
                text: error instanceof Error ? error.message : 'Не удалось обрезать аватар',
            });
        } finally {
            setAvatarCropLoading(false);
        }
    };

    return (
        <ModalPage
            hideCloseButton={hideCloseButton || avatarCropLoading}
            preventClose={preventClose || avatarCropLoading}
            onClose={() => onClose()}
            header={(
                <PlatformProvider
                    value={'ios'}
                >
                    <ModalPageHeader
                        after={avatarFileUrl && (
                            <ButtonGroup
                                stretched={true}
                                align={'right'}
                                gap={'s'}
                            >
                                <Tooltip
                                    description={`Загрузить другой аватар`}
                                    usePortal={true}
                                    placement={"top"}
                                    disableTriggerOnFocus={true}
                                >
                                    <Button
                                        type={'button'}
                                        size={'s'}
                                        mode={'secondary'}
                                        disabled={avatarCropLoading}
                                        onClick={openReplacementDialog}
                                        after={<Icon16Pen/>}
                                    />
                                </Tooltip>
                                <Tooltip
                                    description={`Удалить`}
                                    usePortal={true}
                                    placement={"top"}
                                    disableTriggerOnFocus={true}
                                >
                                    <Button
                                        appearance={'negative'}
                                        type={'button'}
                                        size={'s'}
                                        mode={'secondary'}
                                        disabled={avatarCropLoading}
                                        onClick={() => setAvatarFile(null)}
                                        after={<Icon16Delete/>}
                                    />
                                </Tooltip>
                            </ButtonGroup>
                        )}
                    >
                        Выберите аватар
                    </ModalPageHeader>
                </PlatformProvider>
            )}
            footer={(
                <div className={'modalFooter'}>
                    <ButtonGroup
                        stretched={true}
                        align={'right'}
                    >
                        <Button
                            type={'button'}
                            disabled={avatarCropLoading}
                            size={'m'}
                            mode={'secondary'}
                            onClick={onClose}
                        >
                            Отмена
                        </Button>
                        <Button
                            type={'button'}
                            disabled={avatarCropLoading || !avatarFile || !avatarCropArea}
                            loading={avatarCropLoading}
                            size={'m'}
                            onClick={applyAvatarCrop}
                        >
                            Применить
                        </Button>
                    </ButtonGroup>
                </div>
            )}
            {...restProps}
        >
            <div className={styles.wrap}>
                {avatarFile ? (
                    <div className={styles.avatarCrop}>
                        <input
                            ref={replacementInputRef}
                            hidden={true}
                            type={'file'}
                            accept={['image/png', 'image/jpeg', 'image/webp'].join(',')}
                            onChange={handleReplacementChange}
                        />
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
                    </div>
                ) : (
                    <UploadFile
                        icon={<Icon56UserAddBadgeOutline width={46} height={46}/>}
                        className={styles.upload}
                        classDropzone={styles.upload__dropzone}
                        title={'Выберите аватар'}
                        maxFiles={1}
                        maxSize={5}
                        accept={['image/png', 'image/jpeg', 'image/webp']}
                        showFileList={false}
                        description={'Можно выбрать аватар через проводник или перетащить его в эту область (максимум 5 MB)'}
                        onChange={(files) => setNextAvatarFile(files[0])}
                        onError={error => addSnackbar({type: 'error', text: error.message})}
                    />
                )}
            </div>
        </ModalPage>
    );
};

export default ModalAddAvatar;
