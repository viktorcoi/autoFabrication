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
import {ModalFiltersWorksProps} from "@/components/modals/ModalFilters/ModalFiltersWorks/types";
import styles from '../ModalFilters.module.scss';

const ModalFiltersWorks = (props: ModalFiltersWorksProps) => {

    const {
        data: dataProps,
        preventClose,
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
        operationGroup: true,
        operation: false,
        workGroup: false,
    });
    const [data, setData] = useState({
        operationGroupId: 0,
        operationId: 0,
        workGroupId: 0,
    });
    const [options, setOptions] = useState<Record<string, CustomSelectOptionInterface[]>>({
        operationGroup: [],
        operation: [],
        workGroup: []
    });

    const getWorkGroups = async (id: number, idWorkGroup?: number) => {
        mergeState({workGroup: true}, setLoading);

        controllerRef.current?.abort();
        const controller = createController();

        await ApiService.guide.workGroup.get({
            controller,
            options: { operationId: id },
        }).then(({status, data}) => {
            if (status === 'success') {
                mergeState({workGroup: data.map(({id, name}) => ({
                    value: id,
                    label: name,
                }))}, setOptions);

                if (idWorkGroup && data.some(o => o.id === idWorkGroup)) {
                    mergeState({workGroupId: idWorkGroup}, setData);
                }
                cancelRef.current = false;
            } else if (data === 'canceled') cancelRef.current = true;
        });
    };

    const getOperations = async (id: number, idOperation?: number) => {
        mergeState({operation: true}, setLoading);

        controllerRef.current?.abort();
        const controller = createController();

        await ApiService.guide.operation.get({
            controller,
            options: { operationGroupId: id },
        }).then(async ({status, data}) => {
            if (status === 'success') {
                mergeState({operation: data.map(({id, name}) => ({
                    value: id,
                    label: name,
                }))}, setOptions);

                if (idOperation && data.some(o => o.id === idOperation)) {
                    mergeState({operationId: idOperation}, setData);

                    await getWorkGroups(
                        idOperation,
                        dataProps.workGroupId || undefined
                    ).finally(() => mergeState({workGroup: cancelRef.current}, setLoading));
                }
                cancelRef.current = false;
            } else if (data === 'canceled') cancelRef.current = true;
        });
    }

    useEffect(() => {
        const controller = createController();

        ApiService.guide.operationGroup.get({
            controller,
        }).then(async ({status, data}) => {
            if (status === 'success') {
                mergeState({operationGroup: data.map(({id, name}) => ({
                    value: id,
                    label: name,
                }))}, setOptions);

                if (dataProps.operationGroupId && data.some(({id}) => id === dataProps.operationGroupId)) {
                    mergeState({operationGroupId: dataProps.operationGroupId}, setData);

                    await getOperations(
                        dataProps.operationGroupId,
                        dataProps.operationId || undefined
                    ).finally(() => mergeState({operation: cancelRef.current}, setLoading));
                }
            }
        }).finally(() => mergeState({operationGroup: false}, setLoading));
    }, []);

    const handleChangeOperationGroupId = async (id: number) => {
        mergeState({operationGroupId: id}, setData);
        mergeState({operationId: 0}, setData);
        if (id === 0) return;


        await getOperations(id).finally(() => mergeState({operation: cancelRef.current}, setLoading));
    };

    const handleChangeOperationId = async (id: number) => {
        mergeState({operationId: id}, setData);
        mergeState({workGroupId: 0}, setData);
        if (id === 0) return;

        await getWorkGroups(id).finally(() => mergeState({workGroup: cancelRef.current}, setLoading));
    };

    const disabledApply = useMemo(() => {
        return dataProps.operationGroupId === data.operationGroupId && dataProps.operationId === data.operationId;
    }, [data]);

    const hasDataProp = useMemo(
        () => dataProps.operationGroupId !== 0,
        []
    );

    return (
        <ModalPage
            height={344}
            onClose={onClose}
            preventClose={preventClose}
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
                                    operationGroupId: 0,
                                    operationId: 0,
                                    workGroupId: 0
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
                            onClick={(e) => {
                                if (preventClose) return;
                                onClose('cancel', e);
                            }}
                        >
                            Отмена
                        </Button>
                        <Button
                            onClick={() => {
                                onChangeFilters(data);
                                onClose('updated-data');
                            }}
                            disabled={disabledApply || loading.operationGroup}
                            size={'m'}
                        >
                            Применить
                        </Button>
                    </ButtonGroup>
                </div>
            )}
            {...restProps}
        >
            {loading.operationGroup ? <Spinner className={styles.plug} size={'xl'}/> : (
                <div className={'modalForm'}>
                    <FormItem
                        top={'Группа операций'}
                        noPadding={true}
                    >
                        <Select
                            filterFn={selectFilter.filterFn}
                            options={options.operationGroup}
                            searchable={true}
                            allowClearButton={true}
                            value={data.operationGroupId}
                            onChange={(e) => handleChangeOperationGroupId(Number(e.target.value))}
                            placeholder={'Выберите группу операций'}
                            onInputChange={selectFilter.onInputChange}
                            onOpen={selectFilter.onOpen}
                            onClose={selectFilter.onClose}
                        />
                    </FormItem>
                    <FormItem
                        top={'Операция'}
                        noPadding={true}
                    >
                        <Select
                            disabled={data.operationGroupId === 0}
                            className={classNames(data.operationGroupId === 0 && 'disabled')}
                            filterFn={selectFilter.filterFn}
                            options={options.operation}
                            searchable={true}
                            allowClearButton={true}
                            fetching={loading.operation}
                            value={data.operationId}
                            onChange={(e) => handleChangeOperationId(Number(e.target.value))}
                            placeholder={'Выберите операцию'}
                            onInputChange={selectFilter.onInputChange}
                            onOpen={selectFilter.onOpen}
                            onClose={selectFilter.onClose}
                        />
                    </FormItem>
                    <FormItem
                        top={'Группа работ'}
                        noPadding={true}
                    >
                        <Select
                            disabled={data.operationId === 0}
                            className={classNames(data.operationId === 0 && 'disabled')}
                            filterFn={selectFilter.filterFn}
                            options={options.workGroup}
                            searchable={true}
                            allowClearButton={true}
                            fetching={loading.workGroup}
                            value={data.workGroupId}
                            onChange={(e) => mergeState({workGroupId: Number(e.target.value)}, setData)}
                            placeholder={'Выберите группу работ'}
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

export default ModalFiltersWorks;
