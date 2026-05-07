'use client'

import {
    Button,
    Cell,
    classNames,
    CustomSelectOptionInterface,
    FormItem,
    Input,
    List,
    Placeholder,
    Select,
    SimpleCell,
    Subhead,
    Textarea,
    Title,
    Tooltip
} from "@vkontakte/vkui";
import Link from "next/link";
import {useRouter} from "next/navigation";
import {
    Icon16Clear,
    Icon24Add,
    Icon24BrowserBack, Icon24Cancel,
    Icon24ViewOutline,
    Icon48Linked,
    Icon56GalleryOutline,
} from "@vkontakte/icons";
import {mergeState} from "@/shared/helpers";
import Container from "@/components/Container/Container";
import {SubmitEvent, useEffect, useMemo, useState} from "react";
import styles from '../page.module.scss';
import UploadFile from "@/components/UploadFile/UploadFile";
import {formatBytes, getFilesTotalSize} from "@/components/UploadFile/helpers";
import {ApiService} from "@/apiService/apiService";
import {useController, useSelectFilter} from "@/shared/hooks";
import {useSnackbarStore} from "@/store/snackbar/snackbar";
import {RelatedProductFormItem} from "@/apiService/apiProducts/types";
import NumberPicker from "@/components/NumberPicker/NumberPicker";
import ModalRelatedProducts from "@/components/modals/ModalProducts/ModalRelatedProducts/ModalRelatedProducts";
import ModalProductInfo from "@/components/modals/ModalProducts/ModalProductInfo/ModalProductInfo";
import ImagesProvider from "@/components/ImagesProvider/ImagesProvider";
import ProductImagePreview from "@/components/ProductImagePreview/ProductImagePreview";
import ModalProductImages from "@/components/modals/ModalProducts/ModalProductImages/ModalProductImages";
import {OpenModalsType} from "@/components/modals/types";

type ProductFormData = {
    name: string;
    typeProductId: number;
    materialId: number;
    description: string;
    files: File[];
    images: File[];
    relatedProducts: RelatedProductFormItem[];
};

const initialData: ProductFormData = {
    name: '',
    typeProductId: 0,
    materialId: 0,
    description: '',
    files: [],
    images: [],
    relatedProducts: [],
};

const PRODUCT_IMAGES_MAX_FILES = 20;
const PRODUCT_IMAGES_MAX_TOTAL_SIZE = 100 * 1024 * 1024;

type ProductNewPageModalId = 'modal-related-products' | 'modal-product-images' | 'modal-product-info';

const ProductNewPage = () => {

    const router = useRouter();
    const addSnackbar = useSnackbarStore(state => state.addSnackbar);
    const selectFilter = useSelectFilter();
    const {
        createController,
    } = useController([]);

    const [data, setData] = useState<ProductFormData>({...initialData});
    const [modals, setModals] = useState<OpenModalsType<ProductNewPageModalId>>({
        id: null,
        show: false,
        data: null,
    });
    const [options, setOptions] = useState<Record<string, CustomSelectOptionInterface[]>>({
        typeProduct: [],
        material: [],
    });
    const [loading, setLoading] = useState({
        get: true,
        send: false,
    });

    useEffect(() => {
        const controller = createController();

        Promise.all([
            ApiService.guide.typeProducts.get({
                controller,
                options: {sorting: {id: 'name', sort: 'asc'}},
            }),
            ApiService.guide.material.get({
                controller,
                options: {sorting: {id: 'name', sort: 'asc'}},
            }),
        ]).then(([typeProductsResponse, materialsResponse]) => {
            if (typeProductsResponse.status === 'success') {
                mergeState({
                    typeProduct: typeProductsResponse.data.map(({id, name}) => ({
                        value: id,
                        label: name,
                    })),
                }, setOptions);
            }

            if (materialsResponse.status === 'success') {
                mergeState({
                    material: materialsResponse.data.map(({id, name}) => ({
                        value: id,
                        label: name,
                    })),
                }, setOptions);
            }
        }).finally(() => mergeState({get: false}, setLoading));
    }, []);

    const disabledSave = useMemo(
        () => !data.name.trim() || !data.typeProductId,
        [data.name, data.typeProductId]
    );
    const imagesTotalSize = useMemo(
        () => getFilesTotalSize(data.images),
        [data.images]
    );
    const canAddImages = data.images.length < PRODUCT_IMAGES_MAX_FILES
        && imagesTotalSize < PRODUCT_IMAGES_MAX_TOTAL_SIZE;

    const saveProduct = async (e: SubmitEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (disabledSave || loading.get || loading.send) return;

        mergeState({send: true}, setLoading);

        try {
            const {status} = await ApiService.products.post({
                options: {
                    name: data.name.trim(),
                    typeProductId: data.typeProductId,
                    ...(data.materialId ? {materialId: data.materialId} : {}),
                    description: data.description.trim(),
                    files: data.files,
                    images: data.images,
                    relatedProducts: data.relatedProducts.map(({id, count}) => ({
                        productId: id,
                        count,
                    })),
                },
            });

            if (status === 'success') {
                addSnackbar({
                    type: 'success',
                    text: `Успешно добавлено: "${data.name.trim()}"`,
                });
                router.push('/products');
            }
        } finally {
            mergeState({send: false}, setLoading);
        }
    };

    const updateRelatedProductCount = (id: number, count: number) => {
        setData((prevState) => ({
            ...prevState,
            relatedProducts: prevState.relatedProducts.map((product) => (
                product.id === id ? {...product, count} : product
            )),
        }));
    };

    const removeRelatedProduct = (id: number) => {
        setData((prevState) => ({
            ...prevState,
            relatedProducts: prevState.relatedProducts.filter((product) => product.id !== id),
        }));
    };

    const closeModal = () => {
        mergeState({show: false}, setModals);
    };

    const clearModal = () => {
        setModals({id: null, show: false, data: null});
    };

    const removeImage = (index: number) => {
        setData((prevState) => ({
            ...prevState,
            images: prevState.images.filter((_, currentIndex) => currentIndex !== index),
        }));
    };

    const reorderImage = (from: number, to: number) => {
        if (from === to) return;

        setData((prevState) => {
            const images = [...prevState.images];
            const [movedImage] = images.splice(from, 1);

            if (!movedImage) return prevState;

            images.splice(to, 0, movedImage);

            return {
                ...prevState,
                images,
            };
        });
    };

    return (
        <>
            {'modal-related-products' === modals.id ? (
                <ModalRelatedProducts
                    open={modals.show}
                    selectedProducts={data.relatedProducts}
                    onChangeProducts={(relatedProducts) => mergeState({relatedProducts}, setData)}
                    onClose={closeModal}
                    onClosed={clearModal}
                />
            ) : 'modal-product-images' === modals.id ? (
                <ModalProductImages
                    images={data.images}
                    open={modals.show}
                    onChangeImages={(images) => mergeState({images}, setData)}
                    onClose={closeModal}
                    onClosed={clearModal}
                />
            ) : 'modal-product-info' === modals.id && typeof modals.data === 'number' && (
                <ModalProductInfo
                    productId={modals.data}
                    open={modals.show}
                    onClose={closeModal}
                    onClosed={clearModal}
                />
            )}
            <Container
            header={(
                <>
                    <div className={styles.header}>
                        <Tooltip
                            description={'Вернуться к изделиям'}
                            usePortal={true}
                            placement={"top"}
                            disableTriggerOnFocus={true}
                        >
                            <div>
                                <Link
                                    href={'/products'}
                                >
                                    <Button
                                        mode={'secondary'}
                                        size={'m'}
                                        before={<Icon24BrowserBack/>}
                                    />
                                </Link>
                            </div>
                        </Tooltip>
                        <Title level={'3'} weight={'2'}>Добавление изделия</Title>
                    </div>
                    <Button
                        form={'save-product'}
                        type={'submit'}
                        disabled={disabledSave || loading.get}
                        loading={loading.send}
                        size={'m'}
                    >
                        Сохранить
                    </Button>
                </>
            )}
        >
            <form id={'save-product'} className={styles.wrap} onSubmit={saveProduct}>
                <div className={classNames('island', 'scroll', styles.wrap__left)}>
                    <FormItem
                        top={'Название изделия'}
                        noPadding={true}
                    >
                        <Input
                            disabled={loading.send}
                            value={data.name}
                            onChange={(e) => mergeState({name: e.target.value}, setData)}
                            placeholder={'Введите название изделия'}
                            status={!data.name.trim() ? 'error' : 'default'}
                            maxLength={50}
                        />
                    </FormItem>
                    <FormItem
                        top={'Тип изделия'}
                        noPadding={true}
                    >
                        <Select
                            disabled={loading.send}
                            className={classNames(loading.send && 'disabled')}
                            filterFn={selectFilter.filterFn}
                            options={options.typeProduct}
                            searchable={true}
                            allowClearButton={true}
                            fetching={loading.get}
                            value={data.typeProductId}
                            onChange={(e) => mergeState({typeProductId: Number(e.target.value)}, setData)}
                            placeholder={'Выберите тип изделия'}
                            status={!data.typeProductId ? 'error' : 'default'}
                            onInputChange={selectFilter.onInputChange}
                            onOpen={selectFilter.onOpen}
                            onClose={selectFilter.onClose}
                        />
                    </FormItem>
                    <FormItem
                        top={'Материал'}
                        noPadding={true}
                    >
                        <Select
                            disabled={loading.send}
                            className={classNames(loading.send && 'disabled')}
                            filterFn={selectFilter.filterFn}
                            options={options.material}
                            searchable={true}
                            allowClearButton={true}
                            fetching={loading.get}
                            value={data.materialId}
                            onChange={(e) => mergeState({materialId: Number(e.target.value)}, setData)}
                            placeholder={'Выберите материал'}
                            onInputChange={selectFilter.onInputChange}
                            onOpen={selectFilter.onOpen}
                            onClose={selectFilter.onClose}
                        />
                    </FormItem>
                    <UploadFile
                        disabled={loading.send}
                        value={data.files}
                        maxFiles={20}
                        maxSize={100}
                        maxTotalSize={200}
                        accept={['.zip', '.rar', '.7zip', 'image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/bmp','.docx', '.doc', '.dotx', '.xls', '.xlsx', '.ppt', '.pptx', '.pdf']}
                        onChange={(files) => mergeState({files}, setData)}
                        onError={(error) => addSnackbar({type: 'error', text: error.message})}
                    />
                    <FormItem
                        className={'count-symbols'}
                        top={'Описание'}
                        noPadding={true}
                        bottom={`${data.description.length} из 255`}
                    >
                        <Textarea
                            disabled={loading.send}
                            value={data.description}
                            onChange={(e) => mergeState({description: e.target.value}, setData)}
                            className={styles.textarea}
                            placeholder={'Введите описание'}
                            maxLength={255}
                        />
                    </FormItem>
                    <div className={styles.bond}>
                        <div className={styles.bond__head}>
                            <Subhead>Связанные изделия</Subhead>
                            <Button
                                type={'button'}
                                disabled={loading.get || loading.send}
                                mode={'secondary'}
                                before={<Icon24Add width={20} height={20}/>}
                                onClick={() => setModals({
                                    id: 'modal-related-products',
                                    show: true,
                                    data: null,
                                })}
                            >
                                Добавить
                            </Button>
                        </div>
                        {data.relatedProducts.length === 0 ? (
                            <Placeholder icon={<Icon48Linked/>}>Нет связанных изделий</Placeholder>
                        ) : (
                            <div className={styles.bond__list}>
                                {data.relatedProducts.map((product) => (
                                    <SimpleCell
                                        key={product.id}
                                        className={styles.bond__item}
                                        multiline={true}
                                        after={(
                                            <div className={styles.bond__actions}>
                                                <NumberPicker
                                                    className={styles.bond__count}
                                                    value={product.count}
                                                    min={1}
                                                    max={1000}
                                                    onChange={(count) => updateRelatedProductCount(product.id, count)}
                                                    disabled={loading.send}
                                                />
                                                <Tooltip
                                                    description={'Посмотреть'}
                                                    usePortal={true}
                                                    placement={'top'}
                                                    disableTriggerOnFocus={true}
                                                >
                                                    <Button
                                                        type={'button'}
                                                        size={'m'}
                                                        mode={'tertiary'}
                                                        rounded={true}
                                                        disabled={loading.send}
                                                        before={<Icon24ViewOutline/>}
                                                        onClick={() => setModals({
                                                            id: 'modal-product-info',
                                                            show: true,
                                                            data: product.id,
                                                        })}
                                                    />
                                                </Tooltip>
                                                <Tooltip
                                                    description={'Удалить'}
                                                    usePortal={true}
                                                    placement={'top'}
                                                    disableTriggerOnFocus={true}
                                                >
                                                    <Button
                                                        type={'button'}
                                                        size={'m'}
                                                        mode={'tertiary'}
                                                        rounded={true}
                                                        disabled={loading.send}
                                                        before={<Icon24Cancel/>}
                                                        onClick={() => removeRelatedProduct(product.id)}
                                                    />
                                                </Tooltip>
                                            </div>
                                        )}
                                    >
                                        {product.name}
                                    </SimpleCell>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
                <div className={classNames('island', 'scroll', styles.wrap__right)}>
                    <div className={styles.images}>
                        {!!data.images.length && (
                            <div className={styles.images__head}>
                                <Subhead>Изображения</Subhead>
                                <Button
                                    type={'button'}
                                    mode={'secondary'}
                                    before={<Icon24Add width={20} height={20}/>}
                                    disabled={loading.send || !canAddImages}
                                    onClick={() => setModals({
                                        id: 'modal-product-images',
                                        show: true,
                                        data: null,
                                    })}
                                >
                                    Добавить
                                </Button>
                            </div>
                        )}
                        {data.images.length === 0 ? (
                            <Placeholder
                                className={styles.images__empty}
                                icon={<Icon56GalleryOutline/>}
                                action={(
                                    <Button
                                        type={'button'}
                                        mode={'secondary'}
                                        before={<Icon24Add width={20} height={20}/>}
                                        disabled={loading.send || !canAddImages}
                                        size={'m'}
                                        onClick={() => setModals({
                                            id: 'modal-product-images',
                                            show: true,
                                            data: null,
                                        })}
                                    >
                                        Добавить изображения
                                    </Button>
                                )}
                            >
                                Изображения не добавлены
                            </Placeholder>
                        ) : (
                            <ImagesProvider>
                                <List
                                    className={styles.images__list}
                                    gap={8}
                                >
                                    {data.images.map((image, index) => (
                                        <Cell
                                            key={`${image.name}-${image.type}-${image.size}-${image.lastModified}`}
                                            className={styles.images__item}
                                            mode={'removable'}
                                            draggable={data.images.length > 1 && !loading.send}
                                            removePlaceholder={'Удалить'}
                                            disabled={loading.send}
                                            onRemove={() => removeImage(index)}
                                            onDragFinish={({from, to}) => reorderImage(from, to)}
                                            before={<ProductImagePreview file={image}/>}
                                            subtitle={formatBytes(image.size)}
                                            multiline={true}
                                        >
                                            {image.name}
                                        </Cell>
                                    ))}
                                </List>
                            </ImagesProvider>
                        )}
                    </div>
                </div>
            </form>
            </Container>
        </>
    )
};

export default ProductNewPage;
