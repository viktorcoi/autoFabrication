import {
    Button,
    ButtonGroup,
    FormItem,
    ModalPage,
    ModalPageHeader,
    PlatformProvider,
    Spinner,
    Textarea
} from "@vkontakte/vkui";
import {SubmitEvent, useEffect, useMemo, useState} from "react";
import {ApiService} from "@/apiService/apiService";
import {PatchProcessWorkOptions} from "@/apiService/apiProcessWorks/types";
import {useController} from "@/shared/hooks";
import {mergeState} from "@/shared/helpers";
import {useSnackbarStore} from "@/store/snackbar/snackbar";
import NumberPicker from "@/components/NumberPicker/NumberPicker";
import {ModalManageProcessWorkProps} from "@/components/modals/ModalProducts/ModalManageProcessWork/types";
import styles from "./ModalManageProcessWork.module.scss";

type ManageProcessWorkData = {
    name: string;
    tpz: number;
    tsht: number;
    count: number;
    description: string;
    locked: boolean;
};

const initialData: ManageProcessWorkData = {
    name: "",
    tpz: 0,
    tsht: 0,
    count: 1,
    description: "",
    locked: false,
};

const ModalManageProcessWork = (props: ModalManageProcessWorkProps) => {

    const {
        idProcessWork,
        preventClose,
        onClose = () => {},
        ...restProps
    } = props;

    const addSnackbar = useSnackbarStore(state => state.addSnackbar);
    const {createController} = useController([idProcessWork]);

    const [savedData, setSavedData] = useState<ManageProcessWorkData>({...initialData});
    const [data, setData] = useState<ManageProcessWorkData>({...initialData});
    const [loading, setLoading] = useState({
        get: true,
        send: false,
    });

    useEffect(() => {
        mergeState({get: true}, setLoading);
        const controller = createController();

        ApiService.processWork.getById({
            id: idProcessWork,
            controller,
        }).then(({status, data}) => {
            if (status === "success") {
                const init: ManageProcessWorkData = {
                    name: data.work.name,
                    tpz: data.tpz,
                    tsht: data.tsht,
                    count: data.count,
                    description: data.description ?? "",
                    locked: data.processStep.processOperation.process.disabledById !== null,
                };

                setSavedData(init);
                setData(init);
            } else onClose("error");
        }).finally(() => mergeState({get: false}, setLoading));
    }, [idProcessWork]);

    const editDisabled = data.locked || loading.send;
    const disabledSave = useMemo(() => {
        if (editDisabled) {
            return true;
        }

        return data.tpz === savedData.tpz
            && data.tsht === savedData.tsht
            && data.count === savedData.count
            && data.description.trim() === savedData.description.trim();
    }, [data, editDisabled, savedData]);

    const saveWork = async (event: SubmitEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (disabledSave || loading.send) return;

        mergeState({send: true}, setLoading);

        try {
            const options: PatchProcessWorkOptions = {};

            if (data.tpz !== savedData.tpz) {
                options.tpz = data.tpz;
            }

            if (data.tsht !== savedData.tsht) {
                options.tsht = data.tsht;
            }

            if (data.count !== savedData.count) {
                options.count = data.count;
            }

            if (data.description.trim() !== savedData.description.trim()) {
                options.description = data.description.trim();
            }

            const {status} = await ApiService.processWork.patch({
                id: idProcessWork,
                options,
            });

            if (status === "success") {
                addSnackbar({
                    type: "success",
                    text: `Работа "${data.name}" обновлена`,
                });
                onClose("updated-data");
            }
        } finally {
            mergeState({send: false}, setLoading);
        }
    };

    return (
        <ModalPage
            hideCloseButton={loading.send}
            onClose={onClose}
            preventClose={preventClose || loading.send}
            header={(
                <PlatformProvider value={"ios"}>
                    <ModalPageHeader>{data.name ? `Редактирование: ${data.name}` : "Редактирование работы"}</ModalPageHeader>
                </PlatformProvider>
            )}
            footer={(
                <div className={"modalFooter"}>
                    <ButtonGroup
                        stretched={true}
                        align={"right"}
                    >
                        <Button
                            disabled={loading.send}
                            size={"m"}
                            mode={"secondary"}
                            onClick={(e) => onClose("cancel", e)}
                        >
                            Отмена
                        </Button>
                        <Button
                            form={"save-process-work"}
                            type={"submit"}
                            disabled={disabledSave || loading.get}
                            loading={loading.send}
                            size={"m"}
                        >
                            Сохранить
                        </Button>
                    </ButtonGroup>
                </div>
            )}
            {...restProps}
        >
            {loading.get ? <Spinner size={"xl"} className={styles.plug}/> : (
                <form id={"save-process-work"} className={"modalForm"} onSubmit={saveWork}>
                    <FormItem
                        top={"Тпз, мин"}
                        noPadding={true}
                    >
                        <NumberPicker
                            min={0}
                            max={1_000_000}
                            step={0.1}
                            value={data.tpz}
                            disabled={editDisabled}
                            onChange={(tpz) => mergeState({tpz}, setData)}
                        />
                    </FormItem>
                    <FormItem
                        top={"Тшт, мин"}
                        noPadding={true}
                    >
                        <NumberPicker
                            min={0}
                            max={1_000_000}
                            step={0.1}
                            value={data.tsht}
                            disabled={editDisabled}
                            onChange={(tsht) => mergeState({tsht}, setData)}
                        />
                    </FormItem>
                    <FormItem
                        top={"Кол-во"}
                        noPadding={true}
                    >
                        <NumberPicker
                            min={1}
                            max={1_000_000}
                            step={1}
                            value={data.count}
                            disabled={editDisabled}
                            onChange={(count) => mergeState({count}, setData)}
                        />
                    </FormItem>
                    <FormItem
                        className={"count-symbols"}
                        top={"Описание"}
                        noPadding={true}
                        bottom={`${data.description.length} из 255`}
                    >
                        <Textarea
                            disabled={editDisabled}
                            value={data.description}
                            onChange={(e) => mergeState({description: e.target.value}, setData)}
                            className={styles.textarea}
                            placeholder={"Введите описание"}
                            maxLength={255}
                        />
                    </FormItem>
                </form>
            )}
        </ModalPage>
    );
};

export default ModalManageProcessWork;
