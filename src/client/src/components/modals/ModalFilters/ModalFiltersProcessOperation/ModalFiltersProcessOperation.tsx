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
import {ApiService} from "@/apiService/apiService";
import {mergeState} from "@/shared/helpers";
import {useController, useSelectFilter} from "@/shared/hooks";
import {ModalFiltersProcessOperationProps} from "@/components/modals/ModalFilters/ModalFiltersProcessOperation/types";
import styles from "../ModalFilters.module.scss";

const ModalFiltersProcessOperation = (props: ModalFiltersProcessOperationProps) => {

    const {
        data: dataProps,
        onChangeFilters,
        onClose = () => {},
        ...restProps
    } = props;

    const {createController} = useController([]);
    const selectFilter = useSelectFilter();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<Omit<ModalFiltersProcessOperationProps["data"], "processId">>({
        operationGroupId: 0,
    });
    const [options, setOptions] = useState<Record<string, CustomSelectOptionInterface[]>>({
        operationGroup: [],
    });

    useEffect(() => {
        const controller = createController();

        ApiService.guide.operationGroup.get({
            controller,
            options: {forSelect: true, sorting: {id: "name", sort: "asc"}},
        }).then(({status, data}) => {
            if (status === "success") {
                mergeState({
                    operationGroup: data.map(({id, name}) => ({
                        value: id,
                        label: name,
                    })),
                }, setOptions);

                if (dataProps.operationGroupId && data.some(({id}) => id === dataProps.operationGroupId)) {
                    mergeState({operationGroupId: dataProps.operationGroupId}, setData);
                }
            }
        }).finally(() => setLoading(false));
    }, []);

    const disabledApply = useMemo(
        () => dataProps.operationGroupId === data.operationGroupId,
        [data.operationGroupId, dataProps.operationGroupId]
    );
    const hasDataProp = useMemo(
        () => dataProps.operationGroupId !== 0,
        []
    );

    return (
        <ModalPage
            height={188}
            onClose={onClose}
            header={(
                <PlatformProvider value={"ios"}>
                    <ModalPageHeader>Фильтры</ModalPageHeader>
                </PlatformProvider>
            )}
            footer={(
                <div className={"modalFooter"}>
                    {hasDataProp && (
                        <Button
                            size={"m"}
                            mode={"tertiary"}
                            appearance={"negative"}
                            onClick={() => {
                                onChangeFilters({operationGroupId: 0});
                                onClose("updated-data");
                            }}
                        >
                            Сбросить
                        </Button>
                    )}
                    <ButtonGroup
                        stretched={!hasDataProp}
                        align={"right"}
                    >
                        <Button
                            size={"m"}
                            mode={"secondary"}
                            onClick={(e) => onClose("cancel", e)}
                        >
                            Отмена
                        </Button>
                        <Button
                            onClick={() => {
                                onChangeFilters(data);
                                onClose("updated-data");
                            }}
                            disabled={disabledApply || loading}
                            size={"m"}
                        >
                            Применить
                        </Button>
                    </ButtonGroup>
                </div>
            )}
            {...restProps}
        >
            {loading ? <Spinner className={styles.plug} size={"xl"}/> : (
                <div className={"modalForm"}>
                    <FormItem
                        top={"Группа операций"}
                        noPadding={true}
                    >
                        <Select
                            filterFn={selectFilter.filterFn}
                            options={options.operationGroup}
                            searchable={true}
                            allowClearButton={true}
                            value={data.operationGroupId}
                            onChange={(e) => mergeState({operationGroupId: Number(e.target.value)}, setData)}
                            placeholder={"Выберите группу операций"}
                            onInputChange={selectFilter.onInputChange}
                            onOpen={selectFilter.onOpen}
                            onClose={selectFilter.onClose}
                        />
                    </FormItem>
                </div>
            )}
        </ModalPage>
    );
};

export default ModalFiltersProcessOperation;
