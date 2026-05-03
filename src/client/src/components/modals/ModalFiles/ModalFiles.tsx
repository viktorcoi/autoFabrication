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
};

const ModalFiles = (props: ModalFilesProps) => {

    const {
        itemId,
        name,
        url,
        files,
        onClose = () => {},
        ...restProps
    } = props;

    const addSnackbar = useSnackbarStore(state => state.addSnackbar);
    const [loadingFileId, setLoadingFileId] = useState<number | null>(null);

    const handleDownloadAll = async () => {
        setLoadingFileId(DOWNLOAD_ALL_ID);

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
            setLoadingFileId(null);
        }
    };

    const handleDownload = async (fileId: number, fileName: string) => {
        setLoadingFileId(fileId);

        try {
            await downloadMap[url].one(fileId, fileName);
        } catch (error) {
            addSnackbar({
                type: 'error',
                text: error instanceof Error ? error.message : 'Не удалось скачать файл'
            });
        } finally {
            setLoadingFileId(null);
        }
    };

    return (
        <ModalPage
            onClose={onClose}
            hideCloseButton={loadingFileId !== null}
            preventClose={loadingFileId !== null}
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
                                    loading={loadingFileId === DOWNLOAD_ALL_ID}
                                    disabled={loadingFileId !== null || files.length === 0}
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
                                        loading={loadingFileId === file.id}
                                        disabled={loadingFileId !== null}
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
