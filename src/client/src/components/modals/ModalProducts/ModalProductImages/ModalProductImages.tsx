import {
    Button,
    ButtonGroup,
    ModalPage,
    ModalPageHeader,
    PlatformProvider
} from "@vkontakte/vkui";
import {type UIEvent, useEffect, useMemo, useState} from "react";
import {Icon24Gallery} from "@vkontakte/icons";
import UploadFile from "@/components/UploadFile/UploadFile";
import {useSnackbarStore} from "@/store/snackbar/snackbar";
import {ModalProductImagesProps} from "@/components/modals/ModalProducts/ModalProductImages/types";
import {ModalPageCloseReasonType} from "@/components/modals/types";
import styles from './ModalProductImages.module.scss';

const ModalProductImages = (props: ModalProductImagesProps) => {

    const {
        images,
        onChangeImages,
        onClose,
        ...restProps
    } = props;

    const addSnackbar = useSnackbarStore(state => state.addSnackbar);
    const [files, setFiles] = useState<File[]>([]);
    const [draftImages, setDraftImages] = useState<File[]>(images);

    const savedImages = useMemo(
        () => draftImages.map((image, index) => ({
            id: index,
            name: image.name,
            size: image.size,
        })),
        [draftImages]
    );
    const hasChanges = useMemo(
        () => files.length > 0 ||
            draftImages.length !== images.length ||
            draftImages.some((image, index) => image !== images[index]),
        [draftImages, files.length, images]
    );

    const applyImages = () => {
        if (!hasChanges) return;

        onChangeImages([...draftImages, ...files]);
        setFiles([]);
        onClose('updated-data');
    };

    const removeSavedImage = (id: number | string) => {
        setDraftImages((prevState) => prevState.filter((_, index) => index !== Number(id)));
    };

    return (
        <ModalPage
            onClose={onClose}
            header={(
                <PlatformProvider value={'ios'}>
                    <ModalPageHeader>Добавление фотографий</ModalPageHeader>
                </PlatformProvider>
            )}
            footer={(
                <div className={'modalFooter'}>
                    <ButtonGroup
                        stretched={true}
                        align={'right'}
                    >
                        <Button
                            size={'m'}
                            mode={'secondary'}
                            onClick={(event) => onClose('cancel', event)}
                        >
                            Отмена
                        </Button>
                        <Button
                            size={'m'}
                            disabled={!hasChanges}
                            onClick={applyImages}
                        >
                            Применить
                        </Button>
                    </ButtonGroup>
                </div>
            )}
            {...restProps}
        >
            <div className={styles.content}>
                <UploadFile
                    value={files}
                    savedFiles={savedImages}
                    accept={['image/jpeg', 'image/png', 'image/webp']}
                    maxFiles={10}
                    maxSize={5}
                    maxTotalSize={50}
                    title={'Выберите фотографии'}
                    icon={<Icon24Gallery width={32} height={32}/>}
                    onChange={setFiles}
                    onRemoveSavedFile={(file) => removeSavedImage(file.id)}
                    onError={(error) => addSnackbar({type: 'error', text: error.message})}
                />
            </div>
        </ModalPage>
    );
};

export default ModalProductImages;
