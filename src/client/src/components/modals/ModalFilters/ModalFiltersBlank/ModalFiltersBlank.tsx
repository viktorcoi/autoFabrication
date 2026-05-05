import {
    Button,
    ButtonGroup, classNames, CustomSelectOptionInterface,
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
import {ModalFiltersBlankProps} from "@/components/modals/ModalFilters/ModalFiltersBlank/types";
import styles from '../ModalFilters.module.scss';

const ModalFiltersBlank = (props: ModalFiltersBlankProps) => {

    const {
        data: dataProps,
        onChangeFilters,
        onClose = () => {},
        ...restProps
    } = props;

    const {
        controllerRef,
        createController,
        cancelRef
    } = useController([]);

    const selectFilter = useSelectFilter();

    const [loading, setLoading] = useState({
        materialGroup: true,
        material: false,
    });
    const [data, setData] = useState({
        materialGroupId: 0,
        materialId: 0,
    });
    const [options, setOptions] = useState<Record<string, CustomSelectOptionInterface[]>>({
        materialGroup: [],
        material: [],
    });

    const getMaterials = async (id: number, idMaterial?: number) => {
        mergeState({material: true}, setLoading);

        controllerRef.current?.abort();
        const controller = createController();

        await ApiService.guide.material.get({
            controller,
            options: { materialGroupId: id, sorting: {id: 'name', sort: 'asc'} },
        }).then(({status, data}) => {
            if (status === 'success') {
                mergeState({material: data.map(({id, name}) => ({
                    value: id,
                    label: name,
                }))}, setOptions);

                if (idMaterial && data.some(material => material.id === idMaterial)) {
                    mergeState({materialId: idMaterial}, setData);
                }
                cancelRef.current = false;
            } else if (data === 'canceled') cancelRef.current = true;
        });
    };

    useEffect(() => {
        const controller = createController();

        ApiService.guide.materialGroup.get({
            options: {sorting: {id: 'name', sort: 'asc'}},
            controller,
        }).then(async ({status, data}) => {
            if (status === 'success') {
                mergeState({materialGroup: data.map(({id, name}) => ({
                    value: id,
                    label: name,
                }))}, setOptions);

                if (dataProps.materialGroupId && data.some(({id}) => id === dataProps.materialGroupId)) {
                    mergeState({materialGroupId: dataProps.materialGroupId}, setData);

                    await getMaterials(
                        dataProps.materialGroupId,
                        dataProps.materialId || undefined
                    ).finally(() => mergeState({material: cancelRef.current}, setLoading));
                }
            }
        }).finally(() => mergeState({materialGroup: false}, setLoading));
    }, []);

    const handleChangeMaterialGroupId = async (id: number) => {
        mergeState({materialGroupId: id}, setData);
        mergeState({materialId: 0}, setData);
        if (id === 0) return;

        await getMaterials(id).finally(() => mergeState({material: cancelRef.current}, setLoading));
    };

    const disabledApply = useMemo(() => {
        return (
            dataProps.materialGroupId === data.materialGroupId
            && dataProps.materialId === data.materialId
        );
    }, [data]);

    const hasDataProp = useMemo(
        () => dataProps.materialGroupId !== 0,
        []
    );

    return (
        <ModalPage
            height={266}
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
                                    materialGroupId: 0,
                                    materialId: 0,
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
                            disabled={disabledApply || loading.materialGroup}
                            size={'m'}
                        >
                            Применить
                        </Button>
                    </ButtonGroup>
                </div>
            )}
            {...restProps}
        >
            {loading.materialGroup ? <Spinner className={styles.plug} size={'xl'}/> : (
                <div className={'modalForm'}>
                    <FormItem
                        top={'Группа материалов'}
                        noPadding={true}
                    >
                        <Select
                            filterFn={selectFilter.filterFn}
                            options={options.materialGroup}
                            searchable={true}
                            allowClearButton={true}
                            value={data.materialGroupId}
                            onChange={(e) => handleChangeMaterialGroupId(Number(e.target.value))}
                            placeholder={'Выберите группу материалов'}
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
                            disabled={data.materialGroupId === 0}
                            className={classNames(data.materialGroupId === 0 && 'disabled')}
                            filterFn={selectFilter.filterFn}
                            options={options.material}
                            searchable={true}
                            allowClearButton={true}
                            fetching={loading.material}
                            value={data.materialId}
                            onChange={(e) => mergeState({materialId: Number(e.target.value)}, setData)}
                            placeholder={'Выберите материал'}
                            onInputChange={selectFilter.onInputChange}
                            onOpen={selectFilter.onOpen}
                            onClose={selectFilter.onClose}
                        />
                    </FormItem>
                </div>
            )}
        </ModalPage>
    )
}

export default ModalFiltersBlank;
