import {
    Button,
    ButtonGroup,
    classNames,
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
import {ProcessesDateRangeFilter} from "@/apiService/apiProcesses/types";
import {ModalFiltersProcessProps} from "@/components/modals/ModalFilters/ModalFiltersProcess/types";
import styles from '../ModalFilters.module.scss';

const emptyDateRange: ProcessesDateRangeFilter = [null, null];

const hasDateRangeValue = (value: ProcessesDateRangeFilter) => value.some((date) => date !== null);

const ModalFiltersProcess = (props: ModalFiltersProcessProps) => {

    const {
        data: dataProps,
        productMaterialId,
        onChangeFilters,
        onClose = () => {},
        ...restProps
    } = props;

    const {createController} = useController([]);
    const {createController: createUsersController} = useController([]);
    const selectFilter = useSelectFilter();

    const [loading, setLoading] = useState({
        creator: true,
        blank: Boolean(productMaterialId),
    });
    const [data, setData] = useState<Omit<ModalFiltersProcessProps["data"], "productId">>({
        creatorId: 0,
        blankId: 0,
        updatedAt: emptyDateRange,
    });
    const [options, setOptions] = useState<Record<string, CustomSelectOptionInterface[]>>({
        creator: [],
        blank: [],
    });

    useEffect(() => {
        const controller = createUsersController();

        ApiService.users.get({
            controller,
            options: {forSelect: true, sorting: {id: 'name', sort: 'asc'}},
        }).then(({status, data}) => {
            if (status === 'success') {
                const creatorOptions = data
                    .map(({id, firstName, lastName, middleName}) => ({
                        value: id,
                        label: [firstName, lastName, middleName].filter(Boolean).join(' '),
                    }))
                    .sort((a, b) => String(a.label).localeCompare(String(b.label)));

                mergeState({creator: creatorOptions}, setOptions);

                if (dataProps.creatorId && data.some(({id}) => id === dataProps.creatorId)) {
                    mergeState({creatorId: dataProps.creatorId}, setData);
                }
            }
        }).finally(() => mergeState({creator: false}, setLoading));
    }, []);

    useEffect(() => {
        if (!productMaterialId) {
            mergeState({blank: false}, setLoading);
            return;
        }

        const controller = createController();

        ApiService.guide.blank.get({
            controller,
            options: {
                materialId: productMaterialId,
                sorting: {id: 'name', sort: 'asc'},
            },
        }).then(({status, data}) => {
            if (status === 'success') {
                mergeState({blank: data.map(({id, name}) => ({
                    value: id,
                    label: name,
                }))}, setOptions);

                if (dataProps.blankId && data.some(({id}) => id === dataProps.blankId)) {
                    mergeState({blankId: dataProps.blankId}, setData);
                }
            }
        }).finally(() => mergeState({blank: false}, setLoading));
    }, [productMaterialId]);

    useEffect(() => {
        mergeState({updatedAt: dataProps.updatedAt}, setData);
    }, []);

    const isLoading = loading.creator || loading.blank;
    const blankDisabled = !productMaterialId;

    const disabledApply = useMemo(() => {
        return dataProps.creatorId === data.creatorId
            && dataProps.blankId === data.blankId
            && dataProps.updatedAt[0]?.getTime() === data.updatedAt[0]?.getTime()
            && dataProps.updatedAt[1]?.getTime() === data.updatedAt[1]?.getTime();
    }, [data, dataProps]);

    const hasDataProp = useMemo(
        () => dataProps.creatorId !== 0
            || dataProps.blankId !== 0
            || hasDateRangeValue(dataProps.updatedAt),
        []
    );

    return (
        <ModalPage
            height={360}
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
                                    creatorId: 0,
                                    blankId: 0,
                                    updatedAt: emptyDateRange,
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
                        top={'Разработал'}
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
                        top={'Заготовка'}
                        noPadding={true}
                    >
                        <Select
                            disabled={blankDisabled}
                            className={classNames(blankDisabled && 'disabled')}
                            filterFn={selectFilter.filterFn}
                            options={options.blank}
                            searchable={true}
                            allowClearButton={true}
                            value={data.blankId}
                            onChange={(e) => mergeState({blankId: Number(e.target.value)}, setData)}
                            placeholder={'Выберите заготовку'}
                            onInputChange={selectFilter.onInputChange}
                            onOpen={selectFilter.onOpen}
                            onClose={selectFilter.onClose}
                        />
                    </FormItem>
                    <FormItem
                        top={'Дата изменения'}
                        noPadding={true}
                    >
                        <DateRangeInput
                            value={hasDateRangeValue(data.updatedAt) ? data.updatedAt : null}
                            onChange={(value) => mergeState({updatedAt: value ?? emptyDateRange}, setData)}
                            disableFuture={true}
                            closeOnChange={false}
                        />
                    </FormItem>
                </div>
            )}
        </ModalPage>
    )
}

export default ModalFiltersProcess;
