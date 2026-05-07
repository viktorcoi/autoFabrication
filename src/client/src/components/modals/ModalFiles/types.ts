import React from "react";
import {ModalPageProps} from "@vkontakte/vkui";
import {ModalPageCloseReasonType} from "@/components/modals/types";

export type GuideFilesUrl = '/operation' | '/work' | '/products';

export interface GuideFilesItem {
    id: number;
    name: string;
    size: number;
}

export interface ModalFilesProps extends Omit<ModalPageProps, 'onClose'> {
    itemId: number;
    name: string;
    url: GuideFilesUrl;
    files: GuideFilesItem[];
    onClose(reason: ModalPageCloseReasonType, event?: React.UIEvent<HTMLElement>): void;
}
