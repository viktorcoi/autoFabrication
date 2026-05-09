import {
    Button,
    Caption,
    ModalPage,
    ModalPageHeader,
    Placeholder,
    PlatformProvider,
    SimpleCell,
    Text,
    Tooltip
} from "@vkontakte/vkui";
import {useState} from "react";
import {
    Icon16DownloadOutline,
    Icon24DocumentOutline,
    Icon56FolderOutline
} from "@vkontakte/icons";
import {
    downloadOperationFile,
    downloadOperationFilesArchive,
    downloadWorkFile,
    downloadWorkFilesArchive
} from "@/apiService/apiGuide/helpers";
import {
    downloadProductFile,
    downloadProductFilesArchive
} from "@/apiService/apiProducts/helpers";
import {
    downloadProcessFile,
    downloadProcessFilesArchive
} from "@/apiService/apiProcesses/helpers";
import {
    downloadProcessOperationFile,
    downloadProcessOperationFilesArchive
} from "@/apiService/apiProcessOperations/helpers";
import {useSnackbarStore} from "@/store/snackbar/snackbar";
import {formatBytes} from "@/components/UploadFile/helpers";
import {ModalFilesProps} from "@/components/modals/ModalFiles/types";
import styles from './ModalFiles.module.scss';

const DOWNLOAD_ALL_ID = 0;

const downloadMap = {
    '/operation': {
        all: downloadOperationFilesArchive,
        one: downloadOperationFile,
    },
    '/work': {
        all: downloadWorkFilesArchive,
        one: downloadWorkFile,
    },
    '/products': {
        all: downloadProductFilesArchive,
        one: downloadProductFile,
    },
    '/processes': {
        all: downloadProcessFilesArchive,
        one: downloadProcessFile,
    },
    '/processOperations': {
        all: downloadProcessOperationFilesArchive,
        one: downloadProcessOperationFile,
    },
};

const ModalFiles = (props: ModalFilesProps) => {

    const {
        itemId,
        name,
        url,
        files,
        preventClose,
        onClose = () => {},
        ...restProps
    } = props;

    const addSnackbar = useSnackbarStore(state => state.addSnackbar);
    const [loading, setLoading] = useState<number | null>(null);

    const handleDownloadAll = async () => {
        setLoading(DOWNLOAD_ALL_ID);

        try {
            await downloadMap[url].all(itemId, name);

            addSnackbar({
                type: 'success',
                text: `Скачивание архива из "${name}" запущено`
            });
        } catch (error) {
            addSnackbar({
                type: 'error',
                text: error instanceof Error ? error.message : 'Не удалось скачать файлы'
            });
        } finally {
            setLoading(null);
        }
    };

    const handleDownload = async (fileId: number, fileName: string) => {
        setLoading(fileId);

        try {
            await downloadMap[url].one(fileId, fileName);
        } catch (error) {
            addSnackbar({
                type: 'error',
                text: error instanceof Error ? error.message : 'Не удалось скачать файл'
            });
        } finally {
            setLoading(null);
        }
    };

    return (
        <ModalPage
            onClose={onClose}
            hideCloseButton={loading !== null}
            preventClose={preventClose || loading !== null}
            header={(
                <PlatformProvider value={'ios'}>
                    <ModalPageHeader
                        after={(
                            <Tooltip
                                description={'Скачать все'}
                                usePortal={true}
                                placement={'top'}
                                disableTriggerOnFocus={true}
                            >
                                <Button
                                    mode={'secondary'}
                                    size={'m'}
                                    loading={loading === DOWNLOAD_ALL_ID}
                                    disabled={loading !== null || files.length === 0}
                                    before={<Icon16DownloadOutline />}
                                    onClick={handleDownloadAll}
                                />
                            </Tooltip>
                        )}
                    >
                        {`Файлы из "${name}"`}
                    </ModalPageHeader>
                </PlatformProvider>
            )}
            {...restProps}
        >
            {files.length === 0 ? (
                <Placeholder
                    className={styles.empty}
                    icon={<Icon56FolderOutline />}
                    title={'Файлы отсутствуют'}
                >
                    <Text>Нет загруженных файлов</Text>
                </Placeholder>
            ) : (
                <div className={styles.list}>
                    {files.map((file) => (
                        <SimpleCell
                            multiline={true}
                            key={file.id}
                            className={styles.file}
                            before={(
                                <Icon24DocumentOutline
                                    width={20}
                                    height={20}
                                    fill={'var(--vkui--color_icon_secondary)'}
                                />
                            )}
                            after={(
                                <Tooltip
                                    description={'Скачать'}
                                    usePortal={true}
                                    placement={'top'}
                                    disableTriggerOnFocus={true}
                                >
                                    <Button
                                        mode={'secondary'}
                                        size={'m'}
                                        loading={loading === file.id}
                                        disabled={loading !== null}
                                        before={<Icon16DownloadOutline />}
                                        onClick={() => handleDownload(file.id, file.name)}
                                    />
                                </Tooltip>
                            )}
                            subtitle={(
                                <Caption level={'2'}>
                                    {formatBytes(file.size)}
                                </Caption>
                            )}
                        >
                            {file.name}
                        </SimpleCell>
                    ))}
                </div>
            )}
        </ModalPage>
    );
};

export default ModalFiles;
