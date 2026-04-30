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
import styles from "./UploadFile.module.scss";
import {DragAndDropFileError, DragAndDropFileProps, SavedUploadFile} from "@/components/UploadFile/types";
import {
    formatBytes,
    getAcceptItems,
    getFilesTotalSize,
    isFileAccepted,
    isSameSavedFile,
    isSameFile
} from "@/components/UploadFile/helpers";

export const UploadFile = (props: DragAndDropFileProps) => {

    const {
        value,
        defaultValue = [],
        savedFiles = [],
        onChange,
        onError,
        onRemoveSavedFile,
        accept,
        maxFiles,
        maxSize,
        maxTotalSize,
        disabled = false,
        name,
        title = 'Выберите файлы',
        description,
        showFileList = true,
        removable = true,
        className,
        classDropzone,
        icon = <Icon24UploadOutline width={32} height={32}/>,
        ...restProps
    } = props;

    const inputId = useId();
    const inputRef = useRef<HTMLInputElement | null>(null);
    const [innerFiles, setInnerFiles] = useState<File[]>(defaultValue);
    const [isDragActive, setIsDragActive] = useState(false);

    const isControlled = value !== undefined;
    const files = isControlled ? value : innerFiles;
    const acceptValue = Array.isArray(accept) ? accept.join(',') : accept;
    const acceptItems = useMemo(() => getAcceptItems(accept), [accept]);
    const filesLimit = maxFiles === undefined || !Number.isFinite(maxFiles)
        ? Number.POSITIVE_INFINITY
        : Math.max(0, Math.floor(maxFiles));
    const inputMultiple = filesLimit !== 1;
    const maxSizeBytes = Number.isFinite(maxSize) && maxSize > 0
        ? maxSize * 1024 * 1024
        : null;
    const maxSizeText = maxSizeBytes === null ? null : formatBytes(maxSizeBytes);
    const maxTotalSizeBytes = typeof maxTotalSize === 'number' && Number.isFinite(maxTotalSize) && maxTotalSize > 0
        ? maxTotalSize * 1024 * 1024
        : null;
    const maxTotalSizeText = maxTotalSizeBytes === null ? null : formatBytes(maxTotalSizeBytes);
    const isMultipleFiles = Number.isFinite(filesLimit) ? filesLimit > 1 : true;
    const savedFilesTotalSize = useMemo(
        () => savedFiles.reduce((total, file) => total + file.size, 0),
        [savedFiles]
    );
    const totalFilesCount = files.length + savedFiles.length;
    const currentTotalSize = getFilesTotalSize(files) + savedFilesTotalSize;
    const canReplaceSingleUnsavedFile = filesLimit === 1 && savedFiles.length === 0;
    const hasFileSlots = !Number.isFinite(filesLimit) || totalFilesCount < filesLimit || canReplaceSingleUnsavedFile;
    const hasTotalSizeCapacity = maxTotalSizeBytes === null || currentTotalSize < maxTotalSizeBytes || canReplaceSingleUnsavedFile;
    const canOpenFileDialog = !disabled && hasFileSlots && hasTotalSizeCapacity;

    const defaultDescription = useMemo(() => {
        const limitParts: string[] = [];

        if (Number.isFinite(filesLimit)) {
            limitParts.push(`максимум файлов: ${filesLimit}`);
        }

        if (maxSizeText) {
            limitParts.push(`максимальный размер файла: ${maxSizeText}`);
        }

        if (maxTotalSizeText) {
            limitParts.push(`максимальный общий размер: ${maxTotalSizeText}`);
        }

        return `Можно выбрать файл${isMultipleFiles ? 'ы' : ''} через проводник или перетащить ${isMultipleFiles ? 'их' : 'его'} в эту область${limitParts.length ? ` (${limitParts.join(', ')})` : ''}`;
    }, [filesLimit, isMultipleFiles, maxSizeText, maxTotalSizeText]);

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

    const getMaxTotalSizeError = (file: File): DragAndDropFileError => ({
        code: 'total-size-exceeded',
        file,
        message: `Файл "${file.name}" не добавлен: общий размер файлов больше ${maxTotalSizeText}`,
    });

    const getNoAvailableTotalSizeError = (): DragAndDropFileError => ({
        code: 'total-size-exceeded',
        message: `Нельзя добавить больше файлов: общий размер файлов больше ${maxTotalSizeText}`,
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

        const baseFiles = canReplaceSingleUnsavedFile ? [] : files;
        const availableSlots = Number.isFinite(filesLimit)
            ? Math.max(0, filesLimit - (baseFiles.length + savedFiles.length))
            : Number.POSITIVE_INFINITY;
        const nextFiles: File[] = [];
        const baseFilesTotalSize = getFilesTotalSize(baseFiles) + savedFilesTotalSize;
        let nextFilesTotalSize = 0;

        incomingFiles.forEach(file => {
            if ([...baseFiles, ...nextFiles].some(currentFile => isSameFile(file, currentFile))) {
                emitError({
                    code: 'file-duplicate',
                    file,
                    message: `Файл "${file.name}" уже добавлен`,
                });
                return;
            }

            if (savedFiles.some((savedFile) => isSameSavedFile(file, savedFile))) {
                emitError({
                    code: 'file-duplicate',
                    file,
                    message: `Файл "${file.name}" уже сохранён`,
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

            if (maxTotalSizeBytes !== null && (baseFilesTotalSize + nextFilesTotalSize + file.size) > maxTotalSizeBytes) {
                emitError(getMaxTotalSizeError(file));
                return;
            }

            nextFiles.push(file);
            nextFilesTotalSize += file.size;
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

        if (disabled) {
            return;
        }

        if (Number.isFinite(filesLimit) && !hasFileSlots) {
            emitMaxFilesError();
            return;
        }

        if (maxTotalSizeBytes !== null && !hasTotalSizeCapacity) {
            emitError(getNoAvailableTotalSizeError());
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

    const renderFileItem = (
        key: string,
        name: string,
        size: number,
        onRemove?: () => void,
    ) => (
        <div key={key} className={styles.file}>
            <Icon24DocumentOutline
                fill={'var(--vkui--color_icon_secondary)'}
                className={styles.fileIcon}
                width={20}
                height={20}
            />
            <div className={styles.fileInfo}>
                <Text className={styles.fileName}>{name}</Text>
                <Caption level={'2'} className={styles.fileSize}>
                    {formatBytes(size)}
                </Caption>
            </div>
            {onRemove && (
                <Tooltip
                    description={'Удалить'}
                    usePortal={true}
                    placement={'top'}
                    disableTriggerOnFocus={true}
                >
                    <Button
                        type={'button'}
                        className={styles.remove}
                        onClick={onRemove}
                        mode={'tertiary'}
                        rounded={true}
                        after={<Icon16Clear width={12} height={12}/>}
                    />
                </Tooltip>
            )}
        </div>
    );

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
                className={classNames(
                    styles.dropzone,
                    classDropzone
                )}
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
                <div className={styles.icon}>{icon}</div>

                <div className={styles.content}>
                    <Text weight={'2'}>{title}</Text>
                    <Caption
                        id={`${inputId}-helper`}
                        level={'2'}
                        className={styles.description}
                    >
                        {description || defaultDescription}
                    </Caption>
                </div>
            </div>

            {showFileList && (savedFiles.length > 0 || files.length > 0) && (
                <div className={styles.list}>
                    {savedFiles.map((file: SavedUploadFile) => renderFileItem(
                        `saved-${file.id}`,
                        file.name,
                        file.size,
                        removable && !disabled && onRemoveSavedFile
                            ? () => onRemoveSavedFile(file)
                            : undefined,
                    ))}
                    {files.map((file, index) => renderFileItem(
                        `${file.name}-${file.size}-${file.lastModified}-${index}`,
                        file.name,
                        file.size,
                        removable && !disabled
                            ? () => removeFile(index)
                            : undefined,
                    ))}
                </div>
            )}
        </div>
    )
};

export default UploadFile;
