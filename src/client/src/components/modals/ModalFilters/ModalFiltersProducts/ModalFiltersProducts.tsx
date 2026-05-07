import {
    Button,
    ButtonGroup,
    CustomSelectOptionInterface,
    DateRangeInput,
    FormItem,
    ModalPage,
    ModalPageHeader,
    PlatformProvider,
    Select,
    Spinner
} from "@vkontakte/vkui";
import {useEffect, useMemo, useState} from "react";
import {useController, useSelectFilter} from "@/shared/hooks";
import {ApiService} from "@/apiService/apiService";
import {mergeState} from "@/shared/helpers";
import {ModalFiltersProductsProps} from "@/components/modals/ModalFilters/ModalFiltersProducts/types";
import {ProductsDateRangeFilter} from "@/apiService/apiProducts/types";
import styles from '../ModalFilters.module.scss';

const emptyDateRange: ProductsDateRangeFilter = [null, null];

const hasDateRangeValue = (value: ProductsDateRangeFilter) => value.some((date) => date !== null);

const ModalFiltersProducts = (props: ModalFiltersProductsProps) => {

    const {
        data: dataProps,
        onChangeFilters,
        onClose = () => {},
        ...restProps
    } = props;

    const {
        createController,
    } = useController([]);

    const selectFilter = useSelectFilter();

    const [loading, setLoading] = useState({
        typeProduct: true,
        material: true,
        creator: true,
    });
    const [data, setData] = useState({
        typeProductId: 0,
        materialId: 0,
        creatorId: 0,
        createdAt: emptyDateRange,
    });
    const [options, setOptions] = useState<Record<string, CustomSelectOptionInterface[]>>({
        typeProduct: [],
        material: [],
        creator: [],
    });

    useEffect(() => {
        const controller = createController();

        ApiService.guide.typeProducts.get({
            controller,
            options: {sorting: {id: 'name', sort: 'asc'}},
        }).then(({status, data}) => {
            if (status === 'success') {
                mergeState({typeProduct: data.map(({id, name}) => ({
                    value: id,
                    label: name,
                }))}, setOptions);

                if (dataProps.typeProductId && data.some(({id}) => id === dataProps.typeProductId)) {
                    mergeState({typeProductId: dataProps.typeProductId}, setData);
                }
            }
        }).finally(() => mergeState({typeProduct: false}, setLoading));
    }, []);

    useEffect(() => {
        const controller = createController();

        ApiService.guide.material.get({
            controller,
            options: {sorting: {id: 'name', sort: 'asc'}},
        }).then(({status, data}) => {
            if (status === 'success') {
                mergeState({material: data.map(({id, name}) => ({
                    value: id,
                    label: name,
                }))}, setOptions);

                if (dataProps.materialId && data.some(({id}) => id === dataProps.materialId)) {
                    mergeState({materialId: dataProps.materialId}, setData);
                }
            }
        }).finally(() => mergeState({material: false}, setLoading));
    }, []);

    useEffect(() => {
        const controller = createController();

        ApiService.users.get({
            controller,
        }).then(({status, data}) => {
            if (status === 'success') {
                mergeState({creator: data.map(({id, firstName, lastName, middleName}) => ({
                    value: id,
                    label: [firstName, lastName, middleName].filter(Boolean).join(' '),
                }))}, setOptions);

                if (dataProps.creatorId && data.some(({id}) => id === dataProps.creatorId)) {
                    mergeState({creatorId: dataProps.creatorId}, setData);
                }
            }
        }).finally(() => mergeState({creator: false}, setLoading));
    }, []);

    useEffect(() => {
        mergeState({createdAt: dataProps.createdAt}, setData);
    }, []);

    const isLoading = loading.typeProduct || loading.material || loading.creator;

    const disabledApply = useMemo(() => {
        return dataProps.typeProductId === data.typeProductId
            && dataProps.materialId === data.materialId
            && dataProps.creatorId === data.creatorId
            && dataProps.createdAt[0]?.getTime() === data.createdAt[0]?.getTime()
            && dataProps.createdAt[1]?.getTime() === data.createdAt[1]?.getTime();
    }, [data, dataProps]);

    const hasDataProp = useMemo(
        () => dataProps.typeProductId !== 0
            || dataProps.materialId !== 0
            || dataProps.creatorId !== 0
            || hasDateRangeValue(dataProps.createdAt),
        []
    );

    return (
        <ModalPage
            height={420}
            onClose={onClose}
            header={
                <PlatformProvider value={'ios'}>
                    <ModalPageHeader>Фильтры</ModalPageHeader>
                </PlatformProvider>
            }
            footer={(
                <div className={'modalFooter'}>
                    {hasDataProp && (
                        <Button
                            size={'m'}
                            mode={'tertiary'}
                            appearance={'negative'}
                            onClick={() => {
                                onChangeFilters({
                                    typeProductId: 0,
                                    materialId: 0,
                                    creatorId: 0,
                                    createdAt: emptyDateRange,
                                });
                                onClose('updated-data');
                            }}
                        >
                            Сбросить
                        </Button>
                    )}
                    <ButtonGroup
                        stretched={!hasDataProp}
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
                            onClick={() => {
                                onChangeFilters(data);
                                onClose('updated-data');
                            }}
                            disabled={disabledApply || isLoading}
                            size={'m'}
                        >
                            Применить
                        </Button>
                    </ButtonGroup>
                </div>
            )}
            {...restProps}
        >
            {isLoading ? <Spinner className={styles.plug} size={'xl'}/> : (
                <div className={'modalForm'}>
                    <FormItem
                        top={'Тип изделия'}
                        noPadding={true}
                    >
                        <Select
                            filterFn={selectFilter.filterFn}
                            options={options.typeProduct}
                            searchable={true}
                            allowClearButton={true}
                            value={data.typeProductId}
                            onChange={(e) => mergeState({typeProductId: Number(e.target.value)}, setData)}
                            placeholder={'Выберите тип изделия'}
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
                            filterFn={selectFilter.filterFn}
                            options={options.material}
                            searchable={true}
                            allowClearButton={true}
                            value={data.materialId}
                            onChange={(e) => mergeState({materialId: Number(e.target.value)}, setData)}
                            placeholder={'Выберите материал'}
                            onInputChange={selectFilter.onInputChange}
                            onOpen={selectFilter.onOpen}
                            onClose={selectFilter.onClose}
                        />
                    </FormItem>
                    <FormItem
                        top={'Создал'}
                        noPadding={true}
                    >
                        <Select
                            filterFn={selectFilter.filterFn}
                            options={options.creator}
                            searchable={true}
                            allowClearButton={true}
                            value={data.creatorId}
                            onChange={(e) => mergeState({creatorId: Number(e.target.value)}, setData)}
                            placeholder={'Выберите пользователя'}
                            onInputChange={selectFilter.onInputChange}
                            onOpen={selectFilter.onOpen}
                            onClose={selectFilter.onClose}
                        />
                    </FormItem>
                    <FormItem
                        top={'Дата создания'}
                        noPadding={true}
                    >
                        <DateRangeInput
                            value={hasDateRangeValue(data.createdAt) ? data.createdAt : null}
                            onChange={(value) => mergeState({createdAt: value ?? emptyDateRange}, setData)}
                            disableFuture={true}
                            closeOnChange={false}
                        />
                    </FormItem>
                </div>
            )}
        </ModalPage>
    )
}

export default ModalFiltersProducts;
