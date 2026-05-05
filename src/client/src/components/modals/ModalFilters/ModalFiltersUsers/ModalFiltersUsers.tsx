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
import {ModalFiltersUsersProps} from "@/components/modals/ModalFilters/ModalFiltersUsers/types";
import styles from '../ModalFilters.module.scss';

const ModalFiltersUsers = (props: ModalFiltersUsersProps) => {

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
        role: true,
    });
    const [data, setData] = useState({
        roleId: 0,
    });
    const [options, setOptions] = useState<Record<string, CustomSelectOptionInterface[]>>({
        role: [],
    });

    useEffect(() => {
        const controller = createController();

        ApiService.roles.get({
            controller,
            options: {forSelect: true},
        }).then(({status, data}) => {
            if (status === 'success') {
                mergeState({role: data.map(({id, name}) => ({
                    value: id,
                    label: name,
                }))}, setOptions);

                if (dataProps.roleId && data.some(({id}) => id === dataProps.roleId)) {
                    mergeState({roleId: dataProps.roleId}, setData);
                }
            }
        }).finally(() => mergeState({role: false}, setLoading));
    }, []);

    const disabledApply = useMemo(() => {
        return dataProps.roleId === data.roleId;
    }, [data]);

    const hasDataProp = useMemo(
        () => dataProps.roleId !== 0,
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
                                    roleId: 0,
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
                            disabled={disabledApply || loading.role}
                            size={'m'}
                        >
                            Применить
                        </Button>
                    </ButtonGroup>
                </div>
            )}
            {...restProps}
        >
            {loading.role ? <Spinner className={styles.plug} size={'xl'}/> : (
                <div className={'modalForm'}>
                    <FormItem
                        top={'Роль'}
                        noPadding={true}
                    >
                        <Select
                            filterFn={selectFilter.filterFn}
                            options={options.role}
                            searchable={true}
                            allowClearButton={true}
                            value={data.roleId}
                            onChange={(e) => mergeState({roleId: Number(e.target.value)}, setData)}
                            placeholder={'Выберите роль'}
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

export default ModalFiltersUsers;
