import {HTMLAttributes, ReactNode} from "react";

export type DragAndDropFileErrorCode =
    | 'max-files'
    | 'file-too-large'
    | 'file-invalid-type'
    | 'file-duplicate'
    | 'total-size-exceeded';

export type DragAndDropFileError = {
    code: DragAndDropFileErrorCode;
    file?: File;
    message: string;
};

export type SavedUploadFile = {
    id: number | string;
    name: string;
    size: number;
};

export interface DragAndDropFileProps extends Omit<HTMLAttributes<HTMLDivElement>, 'defaultValue' | 'onChange' | 'onError'> {
    value?: File[];
    defaultValue?: File[];
    savedFiles?: SavedUploadFile[];
    accept?: string | string[];
    maxFiles?: number;
    maxSize: number;
    maxTotalSize?: number;
    disabled?: boolean;
    name?: string;
    icon?: ReactNode;
    title?: string;
    description?: string;
    browseLabel?: string;
    showFileList?: boolean;
    removable?: boolean;
    classDropzone?: string;
    onChange?(files: File[]): void;
    onError?(error: DragAndDropFileError): void;
    onRemoveSavedFile?(file: SavedUploadFile): void;
}
