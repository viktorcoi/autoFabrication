import {
    Button,
    Caption,
    classNames,
    Gallery, HorizontalScroll,
    ModalPage,
    ModalPageHeader,
    Placeholder,
    PlatformProvider,
    SimpleCell,
    Spinner,
    Text,
    Tooltip
} from "@vkontakte/vkui";
import {useEffect, useMemo, useState} from "react";
import Image from "next/image";
import {PhotoView} from "react-photo-view";
import {
    Icon24BrowserBack,
    Icon24DocumentOutline,
    Icon24ViewOutline, Icon48Linked,
    Icon56GalleryOutline
} from "@vkontakte/icons";
import {ApiService} from "@/apiService/apiService";
import {GetByIdProductResponse} from "@/apiService/apiProducts/types";
import {useController} from "@/shared/hooks";
import {mergeState} from "@/shared/helpers";
import ImagesProvider from "@/components/ImagesProvider/ImagesProvider";
import {ModalProductInfoProps} from "@/components/modals/ModalProducts/ModalProductInfo/types";
import ModalFiles from "@/components/modals/ModalFiles/ModalFiles";
import {OpenModalsType} from "@/components/modals/types";
import styles from './ModalProductInfo.module.scss';

const ModalProductInfo = (props: ModalProductInfoProps) => {

    const {
        productId,
        onClose,
        preventClose,
        ...restProps
    } = props;

    const [history, setHistory] = useState([productId]);
    const [product, setProduct] = useState<GetByIdProductResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [imageIndex, setImageIndex] = useState(0);
    const [modals, setModals] = useState<OpenModalsType<'modal-product-files'>>({
        id: null,
        show: false,
        data: null,
    });
    const currentProductId = history[history.length - 1] ?? productId;
    const {
        cancelRef,
        createController,
    } = useController([currentProductId]);

    useEffect(() => {
        setHistory([productId]);
    }, [productId]);

    useEffect(() => {
        setLoading(true);
        setProduct(null);
        setImageIndex(0);
        setModals({id: null, show: false, data: null});

        const controller = createController();

        ApiService.products.getById({
            id: currentProductId,
            controller,
        }).then(({status, data}) => {
            if (status === 'success') {
                setProduct(data);
                cancelRef.current = false;
            } else if (data === 'canceled') {
                cancelRef.current = true;
            }
        }).finally(() => setLoading(cancelRef.current));
    }, [currentProductId]);

    const currentImage = useMemo(
        () => product?.images[imageIndex] ?? null,
        [imageIndex, product?.images]
    );
    const hasDescription = !!product?.description?.trim();
    const hasRelatedProducts = (product?.relatedProducts.length ?? 0) > 0;
    const hasImages = (product?.images.length ?? 0) > 0;
    const hasFiles = (product?.files.length ?? 0) > 0;

    const openProduct = (id: number) => {
        setHistory((prevState) => [...prevState, id]);
    };

    const goBack = () => {
        setHistory((prevState) => prevState.length > 1 ? prevState.slice(0, -1) : prevState);
    };

    return (
        <ModalPage
            className={styles.modal}
            height={500}
            onClose={onClose}
            preventClose={preventClose || modals.id !== null}
            header={(
                <PlatformProvider value={'ios'}>
                    <ModalPageHeader
                        before={history.length > 1 ? (
                            <Tooltip
                                description={'Назад'}
                                usePortal={true}
                                placement={'top'}
                                disableTriggerOnFocus={true}
                            >
                                <Button
                                    mode={'secondary'}
                                    size={'m'}
                                    before={<Icon24BrowserBack/>}
                                    onClick={goBack}
                                />
                            </Tooltip>
                        ) : undefined}
                    >
                        {product ? `Изделие: ${product.name}` : 'Изделие'}
                    </ModalPageHeader>
                </PlatformProvider>
            )}
            {...restProps}
        >
            {'modal-product-files' === modals.id && product && (
                <ModalFiles
                    itemId={product.id}
                    name={product.name}
                    url={'/products'}
                    files={product.files}
                    open={modals.show}
                    onClose={() => mergeState({show: false}, setModals)}
                    onClosed={() => setModals({id: null, show: false, data: null})}
                />
            )}
            {loading ? (
                <Spinner className={styles.spinner} size={'xl'}/>
            ) : !product ? (
                <Placeholder stretched={true}>
                    Изделие не найдено
                </Placeholder>
            ) : (
                <div className={styles.wrap}>
                    <div className={styles.left}>
                        <div className={styles.section}>
                            <div className={styles.grid}>
                                <Text className={styles.label}>ID</Text>
                                <Text>{product.id}</Text>
                                <Text className={styles.label}>Тип изделия</Text>
                                <Text>{product.typeProduct.name}</Text>
                                {product.material && (
                                    <>
                                        <Text className={styles.label}>Материал</Text>
                                        <Text>{product.material.name}</Text>
                                    </>
                                )}
                                <Text className={styles.label}>Создал</Text>
                                <Text>{product.creator.fullName}</Text>
                                {hasDescription && (
                                    <>
                                        <Text className={styles.label}>Описание</Text>
                                        <Text className={styles.description}>
                                            {product.description}
                                        </Text>
                                    </>
                                )}
                            </div>
                            {hasFiles && (
                                <Button
                                    stretched={true}
                                    mode={'secondary'}
                                    size={'m'}
                                    before={<Icon24DocumentOutline width={20} height={20}/>}
                                    onClick={() => mergeState({
                                        id: 'modal-product-files',
                                        show: true,
                                    }, setModals)}
                                >
                                    Вложенные файлы
                                </Button>
                            )}
                        </div>
                        <div className={classNames(styles.section, styles.section__bond)}>
                            <Text className={styles.label}>Связанные изделия</Text>
                            {!hasRelatedProducts ? (
                                <Placeholder stretched={true} icon={<Icon48Linked/>}>Нет связанных изделий</Placeholder>
                            ) : (
                                <div className={styles.relatedList}>
                                    {product.relatedProducts.map((relatedProduct) => (
                                        <SimpleCell
                                            key={relatedProduct.id}
                                            className={styles.cell}
                                            multiline={true}
                                            subtitle={`Количество: ${relatedProduct.count}`}
                                            after={(
                                                <Tooltip
                                                    description={'Посмотреть'}
                                                    usePortal={true}
                                                    placement={'top'}
                                                    disableTriggerOnFocus={true}
                                                >
                                                    <Button
                                                        size={'m'}
                                                        mode={'secondary'}
                                                        before={<Icon24ViewOutline/>}
                                                        onClick={() => openProduct(relatedProduct.productId)}
                                                    />
                                                </Tooltip>
                                            )}
                                        >
                                            {relatedProduct.product.name}
                                        </SimpleCell>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                    {!hasImages ? (
                        <Placeholder
                            stretched={true}
                            className={styles.images__empty}
                            icon={<Icon56GalleryOutline/>}
                        >
                            Изображения не добавлены
                        </Placeholder>
                    ) : (
                        <div className={styles.right}>
                            <ImagesProvider>
                                <div className={styles.gallery}>
                                    <Gallery
                                        looped={true}
                                        slideIndex={imageIndex}
                                        onChange={setImageIndex}
                                        slideWidth={'100%'}
                                        bullets={product.images.length > 1 ? 'dark' : false}
                                        showArrows={product.images.length > 1}
                                    >
                                        {product.images.map((image) => (
                                            <PhotoView key={image.id} src={image.url}>
                                                <button
                                                    type={'button'}
                                                    className={styles.slide}
                                                >
                                                    <Image
                                                        className={styles.image}
                                                        src={image.url}
                                                        alt={image.name}
                                                        width={640}
                                                        height={360}
                                                        unoptimized={true}
                                                    />
                                                </button>
                                            </PhotoView>
                                        ))}
                                    </Gallery>
                                </div>
                                <Caption title={currentImage?.name} className={styles.imageName} level={'2'}>
                                    {currentImage?.name}
                                </Caption>
                                <HorizontalScroll
                                    arrowSize={'s'}
                                >
                                    {product.images.map((image, index) => (
                                        <button
                                            key={image.id}
                                            type={'button'}
                                            className={`${styles.thumb} ${index === imageIndex ? styles.thumbActive : ''}`}
                                            onClick={() => setImageIndex(index)}
                                        >
                                            <Image
                                                className={styles.thumbImage}
                                                src={image.url}
                                                alt={image.name}
                                                width={96}
                                                height={66}
                                                unoptimized={true}
                                            />
                                            <Caption className={styles.thumbName} level={'2'}>
                                                {image.name}
                                            </Caption>
                                        </button>
                                    ))}
                                </HorizontalScroll>
                            </ImagesProvider>
                        </div>
                    )}
                </div>
            )}
        </ModalPage>
    );
};

export default ModalProductInfo;
