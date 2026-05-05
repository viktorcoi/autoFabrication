import {
    Button,
    ButtonGroup,
    CustomSelectOptionInterface,
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
import {ModalFiltersOperationProps} from "@/components/modals/ModalFilters/ModalFiltersOperation/types";
import styles from '../ModalFilters.module.scss';

const ModalFiltersOperation = (props: ModalFiltersOperationProps) => {

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
        operationGroup: true,
    });
    const [data, setData] = useState({
        operationGroupId: 0,
    });
    const [options, setOptions] = useState<Record<string, CustomSelectOptionInterface[]>>({
        operationGroup: [],
    });

    useEffect(() => {
        const controller = createController();

        ApiService.guide.operationGroup.get({
            options: {sorting: {id: 'name', sort: 'asc'}},
            controller,
        }).then(({status, data}) => {
            if (status === 'success') {
                mergeState({operationGroup: data.map(({id, name}) => ({
                    value: id,
                    label: name,
                }))}, setOptions);

                if (dataProps.operationGroupId && data.some(({id}) => id === dataProps.operationGroupId)) {
                    mergeState({operationGroupId: dataProps.operationGroupId}, setData);
                }
            }
        }).finally(() => mergeState({operationGroup: false}, setLoading));
    }, []);

    const disabledApply = useMemo(() => {
        return dataProps.operationGroupId === data.operationGroupId;
    }, [data]);

    const hasDataProp = useMemo(
        () => dataProps.operationGroupId !== 0,
        []
    );

    return (
        <ModalPage
            onClose={onClose}
            height={188}
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
                            onChange={(e) => mergeState({operationGroupId: Number(e.target.value)}, setData)}
                            placeholder={'Выберите группу операций'}
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

export default ModalFiltersOperation;
