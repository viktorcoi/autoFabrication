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
import {GetByIdWorkResponse} from "@/apiService/apiGuide/types";
import {useController} from "@/shared/hooks";
import ModalFiles from "@/components/modals/ModalFiles/ModalFiles";
import {OpenModalsType} from "@/components/modals/types";
import {mergeState} from "@/shared/helpers";
import {ModalWorkInfoProps} from "@/components/modals/ModalGuide/ModalWorkInfo/types";
import styles from "./ModalWorkInfo.module.scss";

const ModalWorkInfo = (props: ModalWorkInfoProps) => {

    const {
        workId,
        onClose,
        preventClose,
        ...restProps
    } = props;

    const [work, setWork] = useState<GetByIdWorkResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [modals, setModals] = useState<OpenModalsType<"modal-work-files">>({
        id: null,
        show: false,
        data: null,
    });
    const {cancelRef, createController} = useController([workId]);

    useEffect(() => {
        setLoading(true);
        setWork(null);
        setModals({id: null, show: false, data: null});

        const controller = createController();

        ApiService.guide.work.getById({
            id: workId,
            controller,
        }).then(({status, data}) => {
            if (status === "success") {
                setWork(data);
                cancelRef.current = false;
            } else if (data === "canceled") {
                cancelRef.current = true;
            }
        }).finally(() => setLoading(cancelRef.current));
    }, [workId]);

    const hasDescription = !!work?.description?.trim();
    const hasGroupDescription = !!work?.workGroup.description?.trim();
    const hasFiles = (work?.files.length ?? 0) > 0;

    return (
        <ModalPage
            onClose={onClose}
            preventClose={preventClose || modals.id !== null}
            header={(
                <PlatformProvider value={"ios"}>
                    <ModalPageHeader>
                        {work ? `Работа: ${work.name}` : "Работа"}
                    </ModalPageHeader>
                </PlatformProvider>
            )}
            {...restProps}
        >
            {"modal-work-files" === modals.id && work && (
                <ModalFiles
                    itemId={work.id}
                    name={work.name}
                    url={"/work"}
                    files={work.files}
                    open={modals.show}
                    onClose={() => mergeState({show: false}, setModals)}
                    onClosed={() => setModals({id: null, show: false, data: null})}
                />
            )}
            {loading ? (
                <Spinner className={styles.spinner} size={"xl"}/>
            ) : !work ? (
                <Placeholder stretched={true}>Работа не найдена</Placeholder>
            ) : (
                <div className={styles.wrap}>
                    <div className={styles.section}>
                        <div className={styles.grid}>
                            <Text className={styles.label}>Группа работ</Text>
                            <Text>{work.workGroup.name}</Text>
                            <Text className={styles.label}>Операция</Text>
                            <Text>{work.workGroup.operation.name}</Text>
                            <Text className={styles.label}>Группа операций</Text>
                            <Text>{work.workGroup.operation.operationGroup.name}</Text>
                            <Text className={styles.label}>Тпз, мин</Text>
                            <Text>{work.tpz}</Text>
                            <Text className={styles.label}>Тшт, мин</Text>
                            <Text>{work.tsht}</Text>
                            {hasGroupDescription && (
                                <>
                                    <Text className={styles.label}>Описание группы</Text>
                                    <Text className={styles.description}>{work.workGroup.description}</Text>
                                </>
                            )}
                            {hasDescription && (
                                <>
                                    <Text className={styles.label}>Описание</Text>
                                    <Text className={styles.description}>{work.description}</Text>
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
                                id: "modal-work-files",
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

export default ModalWorkInfo;
