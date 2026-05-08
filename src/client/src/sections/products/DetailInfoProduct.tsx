import {DetailInfoProductProps} from "@/sections/products/types";
import {useController} from "@/shared/hooks";
import {useEffect, useMemo, useState} from "react";
import {ApiService} from "@/apiService/apiService";
import {GetByIdProductResponse} from "@/apiService/apiProducts/types";
import {
    Button,
    Caption,
    classNames,
    Gallery,
    HorizontalScroll,
    Placeholder,
    SimpleCell,
    Spinner, Switch,
    Text,
    Tooltip
} from "@vkontakte/vkui";
import {
    Icon24DocumentOutline,
    Icon24ViewOutline,
    Icon56GalleryOutline
} from "@vkontakte/icons";
import {mergeState} from "@/shared/helpers";
import ImagesProvider from "@/components/ImagesProvider/ImagesProvider";
import {PhotoView} from "react-photo-view";
import Image from "next/image";
import {OpenModalsType} from "@/components/modals/types";
import ModalFiles from "@/components/modals/ModalFiles/ModalFiles";
import styles from './DetailInfoProduct.module.scss';
import ModalProductInfo from "@/components/modals/ModalProducts/ModalProductInfo/ModalProductInfo";

const DetailInfoProduct = (props: DetailInfoProductProps) => {

    const {
        id,
        show,
        onClose,
        onClosed,
    } = props;
    const [loading, setLoading] = useState(true);
    const [product, setProduct] = useState<GetByIdProductResponse | null>(null);
    const [imageIndex, setImageIndex] = useState(0);
    const [additionalInfo, setAdditionalInfo] = useState(false);
    const [modals, setModals] = useState<OpenModalsType<'modal-product-files' | 'modal-product-info'>>({
        id: null,
        show: false,
        data: null,
    });

    const {
        cancelRef,
        createController,
    } = useController([id]);

    useEffect(() => {
        if (!show) {
            setTimeout(() => {
                onClosed();
            }, 150)
        }
    }, [show]);

    useEffect(() => {
        setImageIndex(0);
        setLoading(true);
        const controller = createController();

        ApiService.products.getById({
            id,
            controller,
        }).then(({status, data}) => {
            if (status === 'success') {
                setProduct(data);
                cancelRef.current = false;
            } else if (data === 'canceled') {
                cancelRef.current = true;
            }
        }).finally(() => setLoading(cancelRef.current));
    }, [id]);

    const currentImage = useMemo(
        () => product?.images[imageIndex] ?? null,
        [imageIndex, product?.images]
    );
    const hasDescription = !!product?.description?.trim();
    const hasRelatedProducts = (product?.relatedProducts.length ?? 0) > 0;
    const hasImages = (product?.images.length ?? 0) > 0;
    const hasFiles = (product?.files.length ?? 0) > 0;

    return (
        <>
            {'modal-product-files' === modals.id && product ? (
                <ModalFiles
                    itemId={product.id}
                    name={product.name}
                    url={'/products'}
                    files={product.files}
                    open={modals.show}
                    onClose={() => mergeState({show: false}, setModals)}
                    onClosed={() => setModals({id: null, show: false, data: null})}
                />
            ) : 'modal-product-info' === modals.id && typeof modals.data === 'number' && (
                <ModalProductInfo
                    productId={modals.data}
                    open={modals.show}
                    onClose={() => mergeState({show: false}, setModals)}
                    onClosed={() => setModals({id: null, show: false, data: null})}
                />
            )}
            <div
                className={styles.wrap}
            >
                <div
                    className={classNames(
                        'island',
                        styles.head
                    )}
                >
                    <Button
                        Component={'label'}
                        mode={'secondary'}
                        after={(
                            <Switch
                                checked={additionalInfo}
                                onChange={(e) => setAdditionalInfo(e.target.checked)}
                            />
                        )}
                    >
                        Дополнительная информация
                    </Button>
                    <Button
                        mode={'secondary'}
                        onClick={() => {
                            onClose()
                            setTimeout(() => {
                                onClosed();
                            }, 150)
                        }}
                    >
                        Закрыть
                    </Button>
                </div>
                <div className={classNames(
                    styles.content,
                    'island',
                    'scroll',
                )}>
                    {loading ? <Spinner size={'xl'} className={styles.spinner}/> : !product ? (
                        <Placeholder className={styles.empty}>
                            Изделие не найдено
                        </Placeholder>
                    ) : (
                        <>
                            {additionalInfo && (
                                <>
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
                                    {hasRelatedProducts && (
                                        <div className={styles.section}>
                                            <Text className={styles.label}>Связанные изделия</Text>
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
                                                                    onClick={() => setModals({
                                                                        id: 'modal-product-info',
                                                                        show: true,
                                                                        data: relatedProduct.productId,
                                                                    })}
                                                                />
                                                            </Tooltip>
                                                        )}
                                                    >
                                                        {relatedProduct.product.name}
                                                    </SimpleCell>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                            {!hasImages ? (
                                <Placeholder
                                    stretched={true}
                                    className={styles.images__empty}
                                    icon={<Icon56GalleryOutline/>}
                                >
                                    Изображения не добавлены
                                </Placeholder>
                            ) : (
                                <div className={styles.section}>
                                    {additionalInfo && (
                                        <Text className={styles.label}>Изображения</Text>
                                    )}
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
                                                                fill={true}
                                                                sizes={'460px'}
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
                        </>
                    )}
                </div>
            </div>
        </>
    )
};

export default DetailInfoProduct;
