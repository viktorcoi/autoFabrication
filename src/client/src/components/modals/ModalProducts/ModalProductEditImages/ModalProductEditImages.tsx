import {
    Button,
    ButtonGroup,
    ModalPage,
    ModalPageHeader,
    PlatformProvider
} from "@vkontakte/vkui";
import {useMemo, useState} from "react";
import {Icon24Gallery} from "@vkontakte/icons";
import UploadFile from "@/components/UploadFile/UploadFile";
import {useSnackbarStore} from "@/store/snackbar/snackbar";
import {ModalProductEditImagesProps} from "@/components/modals/ModalProducts/ModalProductEditImages/types";
import styles from '../ModalProductImages/ModalProductImages.module.scss';

const ModalProductEditImages = (props: ModalProductEditImagesProps) => {

    const {
        existingImages,
        images,
        onChangeImages,
        onClose,
        ...restProps
    } = props;

    const addSnackbar = useSnackbarStore(state => state.addSnackbar);
    const [draftExistingImages, setDraftExistingImages] = useState(existingImages);
    const [draftImages, setDraftImages] = useState(images);

    const savedImages = useMemo(
        () => draftExistingImages.map((image) => ({
            id: image.id,
            name: image.name,
            size: image.size,
        })),
        [draftExistingImages]
    );
    const hasChanges = useMemo(
        () => draftImages.length !== images.length ||
            draftImages.some((image, index) => image !== images[index]) ||
            draftExistingImages.length !== existingImages.length ||
            draftExistingImages.some((image, index) => image.id !== existingImages[index]?.id),
        [draftExistingImages, draftImages, existingImages, images]
    );

    const removeSavedImage = (id: number | string) => {
        setDraftExistingImages((prevState) => prevState.filter((image) => image.id !== Number(id)));
    };

    const applyImages = () => {
        if (!hasChanges) return;

        onChangeImages({
            existingImages: draftExistingImages,
            images: draftImages,
        });
        onClose('updated-data');
    };

    return (
        <ModalPage
            onClose={onClose}
            header={(
                <PlatformProvider value={'ios'}>
                    <ModalPageHeader>Фотографии изделия</ModalPageHeader>
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
                    value={draftImages}
                    savedFiles={savedImages}
                    accept={['image/jpeg', 'image/png', 'image/webp']}
                    maxFiles={10}
                    maxSize={5}
                    maxTotalSize={50}
                    title={'Выберите фотографии'}
                    icon={<Icon24Gallery width={32} height={32}/>}
                    onChange={setDraftImages}
                    onRemoveSavedFile={(file) => removeSavedImage(file.id)}
                    onError={(error) => addSnackbar({type: 'error', text: error.message})}
                />
            </div>
        </ModalPage>
    );
};

export default ModalProductEditImages;
