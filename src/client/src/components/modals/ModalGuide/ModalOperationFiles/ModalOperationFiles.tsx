import {
    Button,
    Caption, Headline,
    ModalPage,
    ModalPageHeader,
    Placeholder,
    PlatformProvider, SimpleCell, Subhead,
    Text, Title, Tooltip
} from "@vkontakte/vkui";
import React, {useState} from "react";
import {
    Icon16DownloadOutline,
    Icon24DocumentOutline, Icon24TrashSimpleOutline,
    Icon56FolderOutline
} from "@vkontakte/icons";
import {downloadOperationFile} from "@/apiService/apiGuide/helpers";
import {useSnackbarStore} from "@/store/snackbar/snackbar";
import {formatBytes} from "@/components/UploadFile/helpers";
import {ModalOperationFilesProps} from "@/components/modals/ModalGuide/ModalOperationFiles/types";
import styles from './ModalOperationFiles.module.scss';

const ModalOperationFiles = (props: ModalOperationFilesProps) => {

    const {
        operationName,
        files,
        onClose = () => {},
        ...restProps
    } = props;

    const addSnackbar = useSnackbarStore(state => state.addSnackbar);

    const [loadingFileId, setLoadingFileId] = useState<number | null>(null);

    const handleDownload = async (fileId: number, fileName: string) => {
        setLoadingFileId(fileId);

        try {
            await downloadOperationFile(fileId, fileName);
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
                                description={`Скачать все`}
                                usePortal={true}
                                placement={'top'}
                                disableTriggerOnFocus={true}
                            >
                                <Button
                                    mode={'secondary'}
                                    size={'m'}
                                    // loading={loadingFileId === file.id}
                                    disabled={loadingFileId !== null}
                                    before={<Icon16DownloadOutline />}
                                    // onClick={() => handleDownload(file.id, file.name)}
                                />
                            </Tooltip>
                        )}
                    >
                        {`Файлы из "${operationName}"`}
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
                    <Text>У этой операции нет загруженных файлов</Text>
                </Placeholder>
            ) : (
                <div className={styles.list}>
                    {files.map((file) => (
                        <SimpleCell
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
                                    description={`Скачать`}
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
    )
};

export default ModalOperationFiles;
