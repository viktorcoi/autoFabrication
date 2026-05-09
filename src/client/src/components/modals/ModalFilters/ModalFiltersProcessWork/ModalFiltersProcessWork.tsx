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
import {ModalFiltersProcessWorkProps} from "@/components/modals/ModalFilters/ModalFiltersProcessWork/types";
import styles from "../ModalFilters.module.scss";

const ModalFiltersProcessWork = (props: ModalFiltersProcessWorkProps) => {

    const {
        operationId,
        data: dataProps,
        onChangeFilters,
        onClose = () => {},
        ...restProps
    } = props;

    const {createController} = useController([operationId]);
    const selectFilter = useSelectFilter();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<Omit<ModalFiltersProcessWorkProps["data"], "stepId">>({
        workGroupId: 0,
    });
    const [options, setOptions] = useState<Record<string, CustomSelectOptionInterface[]>>({
        workGroup: [],
    });

    useEffect(() => {
        const controller = createController();

        ApiService.guide.workGroup.get({
            controller,
            options: {operationId, forSelect: true, sorting: {id: "name", sort: "asc"}},
        }).then(({status, data}) => {
            if (status === "success") {
                mergeState({
                    workGroup: data.map(({id, name}) => ({
                        value: id,
                        label: name,
                    })),
                }, setOptions);

                if (dataProps.workGroupId && data.some(({id}) => id === dataProps.workGroupId)) {
                    mergeState({workGroupId: dataProps.workGroupId}, setData);
                }
            }
        }).finally(() => setLoading(false));
    }, [operationId]);

    const disabledApply = useMemo(
        () => dataProps.workGroupId === data.workGroupId,
        [data.workGroupId, dataProps.workGroupId]
    );
    const hasDataProp = useMemo(
        () => dataProps.workGroupId !== 0,
        []
    );

    return (
        <ModalPage
            height={220}
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
                                onChangeFilters({workGroupId: 0});
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
                        top={"Группа работ"}
                        noPadding={true}
                    >
                        <Select
                            filterFn={selectFilter.filterFn}
                            options={options.workGroup}
                            searchable={true}
                            allowClearButton={true}
                            value={data.workGroupId}
                            onChange={(e) => mergeState({workGroupId: Number(e.target.value)}, setData)}
                            placeholder={"Выберите группу работ"}
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

export default ModalFiltersProcessWork;
