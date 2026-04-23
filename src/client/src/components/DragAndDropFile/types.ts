import {HTMLAttributes} from "react";

export type DragAndDropFileErrorCode = 'max-files' | 'file-too-large' | 'file-invalid-type' | 'file-duplicate';

export type DragAndDropFileError = {
    code: DragAndDropFileErrorCode;
    file?: File;
    message: string;
};

export interface DragAndDropFileProps extends Omit<HTMLAttributes<HTMLDivElement>, 'defaultValue' | 'onChange' | 'onError'> {
    value?: File[];
    defaultValue?: File[];
    accept?: string | string[];
    maxFiles?: number;
    maxSize: number;
    disabled?: boolean;
    name?: string;
    title?: string;
    description?: string;
    browseLabel?: string;
    showFileList?: boolean;
    removable?: boolean;
    onChange?(files: File[]): void;
    onError?(error: DragAndDropFileError): void;
}
