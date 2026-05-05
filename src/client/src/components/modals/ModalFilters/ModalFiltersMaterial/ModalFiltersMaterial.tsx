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
import {ModalFiltersMaterialProps} from "@/components/modals/ModalFilters/ModalFiltersMaterial/types";
import styles from '../ModalFilters.module.scss';

const ModalFiltersMaterial = (props: ModalFiltersMaterialProps) => {

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
        materialGroup: true,
    });
    const [data, setData] = useState({
        materialGroupId: 0,
    });
    const [options, setOptions] = useState<Record<string, CustomSelectOptionInterface[]>>({
        materialGroup: [],
    });

    useEffect(() => {
        const controller = createController();

        ApiService.guide.materialGroup.get({
            controller,
        }).then(({status, data}) => {
            if (status === 'success') {
                mergeState({materialGroup: data.map(({id, name}) => ({
                    value: id,
                    label: name,
                }))}, setOptions);

                if (dataProps.materialGroupId && data.some(({id}) => id === dataProps.materialGroupId)) {
                    mergeState({materialGroupId: dataProps.materialGroupId}, setData);
                }
            }
        }).finally(() => mergeState({materialGroup: false}, setLoading));
    }, []);

    const disabledApply = useMemo(() => {
        return dataProps.materialGroupId === data.materialGroupId;
    }, [data]);

    const hasDataProp = useMemo(
        () => dataProps.materialGroupId !== 0,
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
                                    materialGroupId: 0,
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
                            onChange={(e) => mergeState({materialGroupId: Number(e.target.value)}, setData)}
                            placeholder={'Выберите группу материалов'}
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

export default ModalFiltersMaterial;
