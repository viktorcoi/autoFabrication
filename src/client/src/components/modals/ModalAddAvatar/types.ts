import {ModalPageProps} from "@vkontakte/vkui";

export interface ModalAddAvatarProps extends Omit<ModalPageProps, 'onClose'> {
    onClose(): void;
    onAddAvatar(file: File): void;
}
