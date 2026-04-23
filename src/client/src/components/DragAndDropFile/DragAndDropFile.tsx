'use client'

import {
    type ChangeEvent,
    type DragEvent,
    type KeyboardEvent,
    useId,
    useMemo,
    useRef,
    useState,
} from "react";
import {Button, Caption, classNames, Text, Tooltip} from "@vkontakte/vkui";
import {
    Icon16Clear,
    Icon24DocumentOutline,
    Icon24UploadOutline
} from "@vkontakte/icons";
import styles from "./DragAndDropFile.module.scss";
import {DragAndDropFileError, DragAndDropFileProps} from "@/components/DragAndDropFile/types";
import {formatBytes, getAcceptItems, isFileAccepted} from "@/components/DragAndDropFile/helpers";

const isSameFile = (file: File, compareFile: File) => (
    file.name === compareFile.name &&
    file.size === compareFile.size &&
    file.lastModified === compareFile.lastModified &&
    file.type === compareFile.type
);

export const DragAndDropFile = (props: DragAndDropFileProps) => {

    const {
        value,
        defaultValue = [],
        onChange,
        onError,
        accept,
        maxFiles,
        maxSize,
        disabled = false,
        name,
        title = 'Выберите файлы',
        description,
        browseLabel = 'Выбрать файл',
        showFileList = true,
        removable = true,
        className,
        ...restProps
    } = props;

    const inputId = useId();
    const inputRef = useRef<HTMLInputElement | null>(null);
    const [innerFiles, setInnerFiles] = useState<File[]>(defaultValue);
    const [isDragActive, setIsDragActive] = useState(false);

    const isControlled = value !== undefined;
    const files = isControlled ? value : innerFiles;
    const acceptValue = Array.isArray(accept) ? accept.join(',') : accept;
    const acceptItems = useMemo(() => getAcceptItems(accept), [acceptValue]);
    const filesLimit = maxFiles === undefined || !Number.isFinite(maxFiles)
        ? Number.POSITIVE_INFINITY
        : Math.max(0, Math.floor(maxFiles));
    const inputMultiple = filesLimit !== 1;
    const canOpenFileDialog = !disabled && (filesLimit === 1 || files.length < filesLimit);
    const maxSizeBytes = Number.isFinite(maxSize) && maxSize > 0
        ? maxSize * 1024 * 1024
        : null;
    const maxSizeText = maxSizeBytes === null ? null : formatBytes(maxSizeBytes);

    const updateFiles = (nextFiles: File[]) => {
        if (!isControlled) {
            setInnerFiles(nextFiles);
        }

        onChange?.(nextFiles);
    };

    const getMaxFilesError = (file?: File): DragAndDropFileError => ({
        code: 'max-files',
        file,
        message: file
            ? `Файл "${file.name}" не добавлен: максимум ${filesLimit}`
            : `Нельзя добавить больше файлов: максимум ${filesLimit}`,
    });

    const emitError = (error: DragAndDropFileError) => {
        onError?.(error);
    };

    const emitMaxFilesError = (incomingFiles: File[] = []) => {
        if (incomingFiles.length) {
            incomingFiles.forEach(file => emitError(getMaxFilesError(file)));
            return;
        }

        emitError(getMaxFilesError());
    };

    const validateAndAddFiles = (incomingFiles: File[]) => {
        if (disabled || !incomingFiles.length) return;

        const baseFiles = filesLimit === 1 ? [] : files;
        const availableSlots = Number.isFinite(filesLimit)
            ? Math.max(0, filesLimit - baseFiles.length)
            : Number.POSITIVE_INFINITY;
        const nextFiles: File[] = [];

        incomingFiles.forEach(file => {
            if ([...baseFiles, ...nextFiles].some(currentFile => isSameFile(file, currentFile))) {
                emitError({
                    code: 'file-duplicate',
                    file,
                    message: `Файл "${file.name}" уже добавлен`,
                });
                return;
            }

            if (!isFileAccepted(file, acceptItems)) {
                emitError({
                    code: 'file-invalid-type',
                    file,
                    message: `Файл "${file.name}" имеет неподдерживаемый формат`,
                });
                return;
            }

            if (maxSizeBytes !== null && file.size > maxSizeBytes) {
                emitError({
                    code: 'file-too-large',
                    file,
                    message: `Файл "${file.name}" больше ${maxSizeText}`,
                });
                return;
            }

            if (nextFiles.length >= availableSlots) {
                emitError(getMaxFilesError(file));
                return;
            }

            nextFiles.push(file);
        });

        if (nextFiles.length) {
            updateFiles([...baseFiles, ...nextFiles]);
        }
    };

    const openFileDialog = () => {
        if (canOpenFileDialog) {
            inputRef.current?.click();
            return;
        }

        if (!disabled && Number.isFinite(filesLimit)) {
            emitMaxFilesError();
        }
    };

    const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
        validateAndAddFiles(Array.from(event.target.files ?? []));
        event.target.value = '';
    };

    const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
        event.preventDefault();

        if (disabled) return;

        event.dataTransfer.dropEffect = canOpenFileDialog ? 'copy' : 'none';
        setIsDragActive(true);
    };

    const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
        if (event.currentTarget.contains(event.relatedTarget as Node | null)) {
            return;
        }

        setIsDragActive(false);
    };

    const handleDrop = (event: DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        setIsDragActive(false);

        validateAndAddFiles(Array.from(event.dataTransfer.files));
    };

    const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
        if (event.key !== 'Enter' && event.key !== ' ') return;

        event.preventDefault();
        openFileDialog();
    };

    const removeFile = (index: number) => {
        updateFiles(files.filter((_, currentIndex) => currentIndex !== index));
    };

    return (
        <div
            className={classNames(
                styles.wrap,
                isDragActive && styles['wrap--active'],
                disabled && 'disabled',
                className,
            )}
            {...restProps}
        >
            <input
                ref={inputRef}
                id={inputId}
                className={styles.input}
                type={'file'}
                name={name}
                accept={acceptValue}
                multiple={inputMultiple}
                disabled={disabled}
                onChange={handleInputChange}
            />

            <div
                className={styles.dropzone}
                role={'button'}
                tabIndex={disabled ? -1 : 0}
                aria-disabled={disabled}
                aria-describedby={`${inputId}-helper`}
                onClick={openFileDialog}
                onKeyDown={handleKeyDown}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
            >
                <div className={styles.icon}>
                    <Icon24UploadOutline width={32} height={32}/>
                </div>

                <div className={styles.content}>
                    <Text weight={'2'}>{title}</Text>
                    <Caption
                        id={`${inputId}-helper`}
                        level={'2'}
                        className={styles.description}
                    >
                        {description || `Можно выбрать файл${(maxFiles && maxFiles > 1) ? 'ы' : ''} через проводник или перетащить ${(maxFiles && maxFiles > 1) ? 'их' : 'его'} в эту область${maxSizeText ? ` (${maxFiles ? `максимум файлов: ${maxFiles}, ` : ''}максимальный размер файла: ${maxSizeText})` : ''}`}
                    </Caption>
                </div>
            </div>

            {showFileList && files.length > 0 && (
                <div className={styles.list}>
                    {files.map((file, index) => (
                        <div
                            key={`${file.name}-${file.size}-${file.lastModified}-${index}`}
                            className={styles.file}
                        >
                            <Icon24DocumentOutline
                                fill={'var(--vkui--color_icon_secondary)'}
                                className={styles.fileIcon}
                                width={20}
                                height={20}
                            />
                            <div className={styles.fileInfo}>
                                <Text className={styles.fileName}>{file.name}</Text>
                                <Caption level={'2'} className={styles.fileSize}>
                                    {formatBytes(file.size)}
                                </Caption>
                            </div>
                            {removable && !disabled && (
                                <Tooltip
                                    description={`Удалить`}
                                    usePortal={true}
                                    placement={"top"}
                                >
                                    <Button
                                        className={styles.remove}
                                        onClick={() => removeFile(index)}
                                        mode={'tertiary'}
                                        rounded={true}
                                        after={<Icon16Clear width={12} height={12}/>}
                                    />
                                </Tooltip>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
};

export default DragAndDropFile;
