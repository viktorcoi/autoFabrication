import {
    Button,
    ButtonGroup, classNames,
    Counter,
    CustomSelectOptionInterface,
    FormItem,
    ModalPage,
    ModalPageHeader,
    Placeholder,
    PlatformProvider,
    Search,
    Select,
    SimpleCell,
    Spinner,
    Subhead,
    Tooltip
} from "@vkontakte/vkui";
import {useEffect, useMemo, useState} from "react";
import {
    Icon20HelpOutline,
    Icon24Cancel,
    Icon24ListDeleteOutline,
    Icon24SearchSlashOutline,
    Icon24ViewOutline
} from "@vkontakte/icons";
import {ApiService} from "@/apiService/apiService";
import {GetProductsResponse, RelatedProductFormItem} from "@/apiService/apiProducts/types";
import {mergeState} from "@/shared/helpers";
import {useController, useSearch, useSelectFilter} from "@/shared/hooks";
import {OpenModalsType} from "@/components/modals/types";
import {ModalRelatedProductsProps} from "@/components/modals/ModalProducts/ModalRelatedProducts/types";
import ModalProductInfo from "@/components/modals/ModalProducts/ModalProductInfo/ModalProductInfo";
import styles from './ModalRelatedProducts.module.scss';

const ModalRelatedProducts = (props: ModalRelatedProductsProps) => {

    const {
        selectedProducts,
        editProductId,
        onChangeProducts,
        onClose,
        preventClose,
        ...restProps
    } = props;

    const selectFilter = useSelectFilter();
    const [products, setProducts] = useState<GetProductsResponse[]>([]);
    const [selected, setSelected] = useState<RelatedProductFormItem[]>(selectedProducts);
    const [modals, setModals] = useState<OpenModalsType<'modal-product-info'>>({
        id: null,
        show: false,
        data: null,
    });
    const [filters, setFilters] = useState({
        typeProductId: 0,
        materialId: 0,
    });
    const [options, setOptions] = useState<Record<string, CustomSelectOptionInterface[]>>({
        typeProduct: [],
        material: [],
    });
    const [loading, setLoading] = useState({
        products: true,
        typeProduct: true,
        material: true,
    });

    const {
        search,
        setSearch,
        delaySearch,
        inputRef,
    } = useSearch(loading.products);

    const {createController: createControllerTypes} = useController([]);
    const {createController: createControllerMaterials} = useController([]);
    const {createController: createControllerProducts} = useController([]);

    useEffect(() => {
        setSelected(selectedProducts);
    }, [selectedProducts]);

    useEffect(() => {
        const getOptions = async () => {
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
                } else onClose('error');
            });

            const controllerMaterials = createControllerMaterials();

            await ApiService.guide.material.get({
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
                } else onClose('error');
            });
        };

        getOptions().finally(() => mergeState({
            typeProduct: false,
            material: false,
        }, setLoading));
    }, []);

    useEffect(() => {
        mergeState({products: true}, setLoading);
        const controller = createControllerProducts();

        ApiService.products.get({
            controller,
            options: {
                search: delaySearch.trim() || undefined,
                sorting: {id: 'name', sort: 'asc'},
                typeProductId: filters.typeProductId || undefined,
                materialId: filters.materialId || undefined,
                editProductId,
            },
        }).then(({status, data}) => {
            if (status === 'success') {
                setProducts(data);
            }
        }).finally(() => mergeState({products: false}, setLoading));
    }, [delaySearch, editProductId, filters.typeProductId, filters.materialId]);

    const selectedIds = useMemo(
        () => new Set(selected.map(({id}) => id)),
        [selected]
    );
    const availableProducts = useMemo(
        () => products.filter(({id}) => id !== editProductId && !selectedIds.has(id)),
        [editProductId, products, selectedIds]
    );

    const addProduct = (product: GetProductsResponse) => {
        if (product.disabled) {
            return;
        }

        setSelected((prevState) => (
            prevState.some(({id}) => id === product.id)
                ? prevState
                : [...prevState, {...product, count: 1}]
        ));
    };

    const removeProduct = (id: number) => {
        setSelected((prevState) => prevState.filter((product) => product.id !== id));
    };

    return (
        <ModalPage
            className={styles.modal}
            height={640}
            onClose={onClose}
            preventClose={preventClose || modals.id !== null}
            header={(
                <>
                    <PlatformProvider value={'ios'}>
                        <ModalPageHeader>
                            Связанные изделия
                        </ModalPageHeader>
                    </PlatformProvider>
                    <div className={styles.filters}>
                        <Search
                            value={search}
                            className={styles.filters__search}
                            onChange={e => setSearch(e.target.value)}
                            disabled={loading.products}
                            noPadding={true}
                            slotProps={{input: {getRootRef: inputRef}}}
                        />
                        <FormItem noPadding={true}>
                            <Select
                                filterFn={selectFilter.filterFn}
                                options={options.typeProduct}
                                searchable={true}
                                allowClearButton={true}
                                disabled={loading.products || loading.material || loading.typeProduct}
                                className={classNames((loading.products || loading.material || loading.typeProduct) && 'disabled')}
                                value={filters.typeProductId}
                                onChange={(e) => mergeState({typeProductId: Number(e.target.value)}, setFilters)}
                                placeholder={'Тип изделия'}
                                onInputChange={selectFilter.onInputChange}
                                onOpen={selectFilter.onOpen}
                                onClose={selectFilter.onClose}
                            />
                        </FormItem>
                        <FormItem noPadding={true}>
                            <Select
                                filterFn={selectFilter.filterFn}
                                options={options.material}
                                searchable={true}
                                allowClearButton={true}
                                disabled={loading.products || loading.material || loading.typeProduct}
                                className={classNames((loading.products || loading.material || loading.typeProduct) && 'disabled')}
                                value={filters.materialId}
                                onChange={(e) => mergeState({materialId: Number(e.target.value)}, setFilters)}
                                placeholder={'Материал'}
                                onInputChange={selectFilter.onInputChange}
                                onOpen={selectFilter.onOpen}
                                onClose={selectFilter.onClose}
                            />
                        </FormItem>
                    </div>
                </>
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
                            onClick={(e) => onClose('cancel', e)}
                        >
                            Отмена
                        </Button>
                        <Button
                            size={'m'}
                            onClick={() => {
                                onChangeProducts(selected);
                                onClose('updated-data');
                            }}
                        >
                            Применить
                        </Button>
                    </ButtonGroup>
                </div>
            )}
            {...restProps}
        >
            {'modal-product-info' === modals.id && (
                <ModalProductInfo
                    productId={modals.data}
                    open={modals.show}
                    onClose={() => mergeState({show: false}, setModals)}
                    onClosed={() => setModals({id: null, show: false, data: null})}
                />
            )}
            <div className={styles.wrap}>
                <div className={styles.panel}>
                    <Subhead className={styles.panelHead}>Все изделия</Subhead>
                    {loading.products ? (
                        <Spinner size={'xl'} className={styles.spinner}/>
                    ) : availableProducts.length === 0 ? (
                        <Placeholder
                            stretched={true}
                            className={styles.empty}
                            icon={(!!search.trim() || filters.typeProductId !== 0 || filters.materialId !== 0) ? (
                                <Icon24SearchSlashOutline width={48} height={48}/>
                            ) : <Icon24ListDeleteOutline width={48} height={48}/>}
                        >
                            {`${(!!search.trim() || filters.typeProductId !== 0 || filters.materialId !== 0) ? 'Изделия не найдены' : 'Нет изделий'}`}
                        </Placeholder>
                    ) : (
                        <div className={styles.list}>
                            {availableProducts.map((product) => (
                                <SimpleCell
                                    key={product.id}
                                    disabled={product.disabled}
                                    className={classNames(styles.cell, product.disabled && styles['disabled'])}
                                    multiline={true}
                                    before={!!product.disabledReason && (
                                        <Tooltip
                                            description={product.disabledReason}
                                            usePortal={true}
                                            placement={'top'}
                                            disableTriggerOnFocus={true}
                                        >
                                            <Icon20HelpOutline className={styles.cell__help}/>
                                        </Tooltip>
                                    )}
                                    onClick={() => addProduct(product)}
                                    after={(
                                        <Tooltip
                                            description={'Посмотреть'}
                                            usePortal={true}
                                            placement={'top'}
                                            disableTriggerOnFocus={true}
                                        >
                                            <Button
                                                rounded={true}
                                                size={'m'}
                                                mode={'tertiary'}
                                                before={<Icon24ViewOutline/>}
                                                onClick={(event) => {
                                                    event.stopPropagation();
                                                    setModals({
                                                        id: 'modal-product-info',
                                                        show: true,
                                                        data: product.id,
                                                    });
                                                }}
                                            />
                                        </Tooltip>
                                    )}
                                >
                                    {product.name}
                                </SimpleCell>
                            ))}
                        </div>
                    )}
                </div>
                <div className={styles.panel}>
                    <div className={styles.panelHead}>
                        <Subhead>Выбранные изделия</Subhead>
                        <Counter size={'s'}>{selected.length}</Counter>
                    </div>
                    {selected.length === 0 ? (
                        <Placeholder
                            stretched={true}
                            className={styles.empty}
                            icon={<Icon24ListDeleteOutline width={48} height={48}/>}
                        >
                            Нет выбранных изделий
                        </Placeholder>
                    ) : (
                        <div className={styles.list}>
                            {selected.map((product) => (
                                <SimpleCell
                                    key={product.id}
                                    className={styles.cell}
                                    multiline={true}
                                    after={(
                                        <ButtonGroup
                                            gap={'none'}
                                            className={styles.cell__buttons}
                                        >
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
                                                    before={<Icon24Cancel/>}
                                                    onClick={() => removeProduct(product.id)}
                                                />
                                            </Tooltip>
                                        </ButtonGroup>
                                    )}
                                >
                                    {product.name}
                                </SimpleCell>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </ModalPage>
    );
};

export default ModalRelatedProducts;
