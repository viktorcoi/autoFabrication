import {
    Button,
    ButtonGroup,
    ModalPage,
    ModalPageHeader,
    PlatformProvider,
    Spinner,
    type ModalPageProps,
} from "@vkontakte/vkui";
import {type ChangeEvent, useEffect, useRef, useState} from "react";
import Cropper, {type Area, type Point} from "react-easy-crop";
import DragAndDropFile from "@/components/DragAndDropFile/DragAndDropFile";
import {useSnackbarStore} from "@/store/snackbar/snackbar";
import styles from "./ModalAddAvatar.module.scss";

const AVATAR_OUTPUT_SIZE = 512;
const AVATAR_ACCEPT = ['image/png', 'image/jpeg', 'image/webp'];
const AVATAR_MAX_SIZE_MB = 5;

interface ModalAddAvatarProps extends Omit<ModalPageProps, 'onClose'> {
    onClose(): void;
    onAddAvatar(file: File): void;
}

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
                <PlatformProvider value={'ios'}>
                    <ModalPageHeader>Выберите аватар</ModalPageHeader>
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
            {avatarFile ? (
                <div className={styles.avatarCrop}>
                    <input
                        ref={replacementInputRef}
                        hidden={true}
                        type={'file'}
                        accept={AVATAR_ACCEPT.join(',')}
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
                    <ButtonGroup
                        stretched={true}
                        align={'right'}
                    >
                        <Button
                            type={'button'}
                            size={'s'}
                            mode={'secondary'}
                            disabled={avatarCropLoading}
                            onClick={openReplacementDialog}
                        >
                            Выбрать другое
                        </Button>
                    </ButtonGroup>
                </div>
            ) : (
                <DragAndDropFile
                    title={'Выберите аватар'}
                    maxFiles={1}
                    maxSize={AVATAR_MAX_SIZE_MB}
                    accept={AVATAR_ACCEPT}
                    showFileList={false}
                    description={'Можно выбрать аватар через проводник или перетащить его в эту область (максимум 5 MB)'}
                    onChange={(files) => setNextAvatarFile(files[0])}
                    onError={error => addSnackbar({type: 'error', text: error.message})}
                />
            )}
        </ModalPage>
    );
};

export default ModalAddAvatar;
