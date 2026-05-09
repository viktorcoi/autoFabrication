import {
    Button,
    ModalPage,
    ModalPageHeader,
    Placeholder,
    PlatformProvider,
    Spinner,
    Text
} from "@vkontakte/vkui";
import {useEffect, useState} from "react";
import {Icon24DocumentOutline} from "@vkontakte/icons";
import {ApiService} from "@/apiService/apiService";
import {GetByIdOperationResponse} from "@/apiService/apiGuide/types";
import {useController} from "@/shared/hooks";
import ModalFiles from "@/components/modals/ModalFiles/ModalFiles";
import {OpenModalsType} from "@/components/modals/types";
import {mergeState} from "@/shared/helpers";
import {ModalOperationInfoProps} from "@/components/modals/ModalGuide/ModalOperationInfo/types";
import styles from "./ModalOperationInfo.module.scss";

const ModalOperationInfo = (props: ModalOperationInfoProps) => {

    const {
        operationId,
        onClose,
        preventClose,
        ...restProps
    } = props;

    const [operation, setOperation] = useState<GetByIdOperationResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [modals, setModals] = useState<OpenModalsType<"modal-operation-files">>({
        id: null,
        show: false,
        data: null,
    });
    const {cancelRef, createController} = useController([operationId]);

    useEffect(() => {
        setLoading(true);
        setOperation(null);
        setModals({id: null, show: false, data: null});

        const controller = createController();

        ApiService.guide.operation.getById({
            id: operationId,
            controller,
        }).then(({status, data}) => {
            if (status === "success") {
                setOperation(data);
                cancelRef.current = false;
            } else if (data === "canceled") {
                cancelRef.current = true;
            }
        }).finally(() => setLoading(cancelRef.current));
    }, [operationId]);

    const hasDescription = !!operation?.description?.trim();
    const hasGroupDescription = !!operation?.operationGroup.description?.trim();
    const hasFiles = (operation?.files.length ?? 0) > 0;

    return (
        <ModalPage
            onClose={onClose}
            preventClose={preventClose || modals.id !== null}
            header={(
                <PlatformProvider value={"ios"}>
                    <ModalPageHeader>
                        {operation ? `Операция: ${operation.name}` : "Операция"}
                    </ModalPageHeader>
                </PlatformProvider>
            )}
            {...restProps}
        >
            {"modal-operation-files" === modals.id && operation && (
                <ModalFiles
                    itemId={operation.id}
                    name={operation.name}
                    url={"/operation"}
                    files={operation.files}
                    open={modals.show}
                    onClose={() => mergeState({show: false}, setModals)}
                    onClosed={() => setModals({id: null, show: false, data: null})}
                />
            )}
            {loading ? (
                <Spinner className={styles.spinner} size={"xl"}/>
            ) : !operation ? (
                <Placeholder stretched={true}>Операция не найдена</Placeholder>
            ) : (
                <div className={styles.wrap}>
                    <div className={styles.section}>
                        <div className={styles.grid}>
                            <Text className={styles.label}>Группа операций</Text>
                            <Text>{operation.operationGroup.name}</Text>
                            {hasGroupDescription && (
                                <>
                                    <Text className={styles.label}>Описание группы</Text>
                                    <Text className={styles.description}>{operation.operationGroup.description}</Text>
                                </>
                            )}
                            {hasDescription && (
                                <>
                                    <Text className={styles.label}>Описание</Text>
                                    <Text className={styles.description}>{operation.description}</Text>
                                </>
                            )}
                        </div>
                    </div>
                    {hasFiles && (
                        <Button
                            mode={"secondary"}
                            size={"m"}
                            stretched={true}
                            before={<Icon24DocumentOutline width={20} height={20}/>}
                            onClick={() => mergeState({
                                id: "modal-operation-files",
                                show: true,
                            }, setModals)}
                        >
                            Вложенные файлы
                        </Button>
                    )}
                </div>
            )}
        </ModalPage>
    );
};

export default ModalOperationInfo;
