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
    SimpleCell, Spinner,
    Subhead,
    Textarea,
    Title,
    Tooltip
} from "@vkontakte/vkui";
import Link from "next/link";
import {useParams, useRouter} from "next/navigation";
import {
    Icon24Add,
    Icon24BrowserBack,
    Icon24Cancel,
    Icon24ViewOutline,
    Icon48Linked,
    Icon56GalleryOutline,
} from "@vkontakte/icons";
import {SubmitEvent, useEffect, useMemo, useState} from "react";
import {mergeState} from "@/shared/helpers";
import Container from "@/components/Container/Container";
import styles from '../../page.module.scss';
import UploadFile from "@/components/UploadFile/UploadFile";
import {formatBytes, getFilesTotalSize} from "@/components/UploadFile/helpers";
import {ApiService} from "@/apiService/apiService";
import {useController, useSelectFilter} from "@/shared/hooks";
import {useSnackbarStore} from "@/store/snackbar/snackbar";
import {
    PathProductOptions,
} from "@/apiService/apiProducts/types";
import NumberPicker from "@/components/NumberPicker/NumberPicker";
import ModalRelatedProducts from "@/components/modals/ModalProducts/ModalRelatedProducts/ModalRelatedProducts";
import ModalProductInfo from "@/components/modals/ModalProducts/ModalProductInfo/ModalProductInfo";
import ImagesProvider from "@/components/ImagesProvider/ImagesProvider";
import ProductImagePreview from "@/components/ProductImagePreview/ProductImagePreview";
import {OpenModalsType} from "@/components/modals/types";
import ModalProductEditImages from "@/components/modals/ModalProducts/ModalProductEditImages/ModalProductEditImages";
import {ProductEditFormData, ProductImageListItem} from "@/app/products/edit/[id]/types";
import {
    getProductFormData, getProductImageItems,
    getProductItemIds,
    getProductOrderedItemIds,
    getRelatedProductsSignature
} from "@/app/products/edit/[id]/helpers";

const initialData: ProductEditFormData = {
    name: '',
    typeProductId: 0,
    materialId: 0,
    description: '',
    files: [],
    existingFiles: [],
    images: [],
    existingImages: [],
    relatedProducts: [],
};

const ProductEditPage = () => {

    const router = useRouter();
    const params = useParams<{id: string}>();
    const productId = useMemo(() => Number(params.id), [params.id]);
    const addSnackbar = useSnackbarStore(state => state.addSnackbar);
    const selectFilter = useSelectFilter();
    const {
        createController,
    } = useController([productId]);

    const [savedData, setSavedData] = useState<ProductEditFormData>({...initialData});
    const [data, setData] = useState<ProductEditFormData>({...initialData});
    const [modals, setModals] = useState<OpenModalsType<'modal-related-products' | 'modal-product-images' | 'modal-product-info'>>({
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

    const {createController: createControllerTypes} = useController([]);
    const {createController: createControllerMaterials} = useController([]);
    const {createController: createControllerProduct} = useController([]);

    useEffect(() => {
        if (!Number.isFinite(productId) || productId <= 0) {
            router.push('/products');
            return;
        }

        const getData = async () => {
            const controllerTypes = createControllerTypes();

            ApiService.guide.typeProducts.get({
                controller: controllerTypes,
                options: {sorting: {id: 'name', sort: 'asc'}},
            }).then(({status, data}) => {
                if (status === 'success') {
                    mergeState({
                        typeProduct: data.map(({id, name}) => ({
                            value: id,
                            label: name,
                        })),
                    }, setOptions);
                } else router.push('/products');
            });

            const controllerMaterials = createControllerMaterials();

            ApiService.guide.material.get({
                controller: controllerMaterials,
                options: {sorting: {id: 'name', sort: 'asc'}},
            }).then(({status, data}) => {
                if (status === 'success') {
                    mergeState({
                        material: data.map(({id, name}) => ({
                            value: id,
                            label: name,
                        })),
                    }, setOptions);
                } else router.push('/products');
            });

            const controller = createControllerProduct();

            await ApiService.products.getById({
                id: productId,
                controller,
            }).then(({status, data}) => {
                if (status === 'success') {
                    const init = getProductFormData(data);

                    setSavedData(init);
                    setData(init);
                } else router.push('/products');
            });
        };

        getData().finally(() => mergeState({get: false}, setLoading));
    }, [productId]);

    const removedFileIds = useMemo(
        () => getProductItemIds(savedData.existingFiles).filter((fileId) => !getProductItemIds(data.existingFiles).includes(fileId)),
        [data.existingFiles, savedData.existingFiles]
    );
    const removedImageIds = useMemo(
        () => getProductItemIds(savedData.existingImages).filter((imageId) => !getProductItemIds(data.existingImages).includes(imageId)),
        [data.existingImages, savedData.existingImages]
    );
    const relatedProductsChanged = useMemo(
        () => getRelatedProductsSignature(data.relatedProducts) !== getRelatedProductsSignature(savedData.relatedProducts),
        [data.relatedProducts, savedData.relatedProducts]
    );
    const imageOrderChanged = useMemo(
        () => JSON.stringify(getProductOrderedItemIds(data.existingImages)) !== JSON.stringify(getProductOrderedItemIds(savedData.existingImages)),
        [data.existingImages, savedData.existingImages]
    );
    const disabledSave = useMemo(() => {
        const validRequired = !!data.name.trim() && !!data.typeProductId;
        const validEdit = validRequired && (
            data.name.trim() !== savedData.name.trim() ||
            data.typeProductId !== savedData.typeProductId ||
            data.materialId !== savedData.materialId ||
            data.description.trim() !== savedData.description.trim() ||
            data.files.length > 0 ||
            removedFileIds.length > 0 ||
            data.images.length > 0 ||
            removedImageIds.length > 0 ||
            imageOrderChanged ||
            relatedProductsChanged
        );

        return !validEdit;
    }, [data, imageOrderChanged, removedFileIds, removedImageIds, relatedProductsChanged, savedData]);
    const imagesTotalSize = useMemo(
        () => getFilesTotalSize(data.images) +
            data.existingImages.reduce((total, image) => total + image.size, 0),
        [data.existingImages, data.images]
    );
    const imageItems = useMemo(
        () => getProductImageItems(data),
        [data]
    );
    const canAddImages = imageItems.length < 10 && imagesTotalSize < (50 * 1024 * 1024);

    const saveProduct = async (e: SubmitEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (disabledSave || loading.get || loading.send || !Number.isFinite(productId) || productId <= 0) return;

        mergeState({send: true}, setLoading);

        const options: PathProductOptions = {};

        if (data.name.trim() !== savedData.name.trim()) {
            options.name = data.name.trim();
        }

        if (data.typeProductId !== savedData.typeProductId) {
            options.typeProductId = data.typeProductId;
        }

        if (data.materialId !== savedData.materialId) {
            options.materialId = data.materialId || null;
        }

        if (data.description.trim() !== savedData.description.trim()) {
            options.description = data.description.trim();
        }

        if (removedFileIds.length) {
            options.removedFileIds = removedFileIds;
        }

        if (removedImageIds.length) {
            options.removedImageIds = removedImageIds;
        }

        if (imageOrderChanged) {
            options.imageOrderIds = getProductOrderedItemIds(data.existingImages);
        }

        if (data.files.length) {
            options.files = data.files;
        }

        if (data.images.length) {
            options.images = data.images;
        }

        if (relatedProductsChanged) {
            options.relatedProducts = data.relatedProducts.map(({id, count}) => ({
                productId: id,
                count,
            }));
        }

        const controller = createController();

        try {
            const {status} = await ApiService.products.patch({
                id: productId,
                options,
                controller,
            });

            if (status === 'success') {
                addSnackbar({
                    type: 'success',
                    text: `Успешно отредактировано: "${data.name.trim()}"`,
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

    const removeFile = (id: number | string) => {
        setData((prevState) => ({
            ...prevState,
            existingFiles: prevState.existingFiles.filter((file) => file.id !== Number(id)),
        }));
    };

    const closeModal = () => {
        mergeState({show: false}, setModals);
    };

    const clearModal = () => {
        setModals({id: null, show: false, data: null});
    };

    const removeImage = (item: ProductImageListItem) => {
        setData((prevState) => item.type === 'existing' ? {
            ...prevState,
            existingImages: prevState.existingImages.filter((image) => image.id !== item.image.id),
        } : {
            ...prevState,
            images: prevState.images.filter((image) => image !== item.image),
        });
    };

    const reorderImage = (from: number, to: number) => {
        if (from === to) return;

        setData((prevState) => {
            const items = getProductImageItems(prevState);
            const [movedImage] = items.splice(from, 1);

            if (!movedImage) return prevState;

            items.splice(to, 0, movedImage);

            return {
                ...prevState,
                existingImages: items
                    .filter((item): item is Extract<ProductImageListItem, {type: 'existing'}> => item.type === 'existing')
                    .map(({image}) => image),
                images: items
                    .filter((item): item is Extract<ProductImageListItem, {type: 'new'}> => item.type === 'new')
                    .map(({image}) => image),
            };
        });
    };

    return (
        <>
            {'modal-related-products' === modals.id ? (
                <ModalRelatedProducts
                    open={modals.show}
                    editProductId={productId}
                    selectedProducts={data.relatedProducts}
                    onChangeProducts={(relatedProducts) => mergeState({relatedProducts}, setData)}
                    onClose={closeModal}
                    onClosed={clearModal}
                />
            ) : 'modal-product-images' === modals.id ? (
                <ModalProductEditImages
                    existingImages={data.existingImages}
                    images={data.images}
                    open={modals.show}
                    onChangeImages={(imagesData) => mergeState(imagesData, setData)}
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
                            <Title level={'3'} weight={'2'}>Редактирование изделия</Title>
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
                {loading.get ? <Spinner size={'xl'}/> : (
                    <form
                        id={'save-product'}
                        className={styles.wrap}
                        onSubmit={saveProduct}
                    >
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
                                savedFiles={data.existingFiles}
                                maxFiles={20}
                                maxSize={100}
                                maxTotalSize={200}
                                accept={['.zip', '.rar', '.7zip', 'image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/bmp','.docx', '.doc', '.dotx', '.xls', '.xlsx', '.ppt', '.pptx', '.pdf']}
                                onChange={(files) => mergeState({files}, setData)}
                                onRemoveSavedFile={(file) => removeFile(file.id)}
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
                                {!!imageItems.length && (
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
                                {imageItems.length === 0 ? (
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
                                            {imageItems.map((item) => (
                                                <Cell
                                                    key={item.key}
                                                    className={styles.images__item}
                                                    mode={'removable'}
                                                    draggable={imageItems.length > 1}
                                                    removePlaceholder={'Удалить'}
                                                    disabled={loading.send}
                                                    onRemove={() => removeImage(item)}
                                                    onDragFinish={({from, to}) => reorderImage(from, to)}
                                                    before={item.type === 'existing' ? (
                                                        <ProductImagePreview
                                                            src={item.image.url}
                                                            name={item.image.name}
                                                        />
                                                    ) : (
                                                        <ProductImagePreview file={item.image}/>
                                                    )}
                                                    subtitle={formatBytes(item.image.size)}
                                                    multiline={true}
                                                >
                                                    {item.image.name}
                                                </Cell>
                                            ))}
                                        </List>
                                    </ImagesProvider>
                                )}
                            </div>
                        </div>
                    </form>
                )}
            </Container>
        </>
    )
};

export default ProductEditPage;
