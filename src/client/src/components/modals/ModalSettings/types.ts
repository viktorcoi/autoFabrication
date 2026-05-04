import {ModalPageProps} from "@vkontakte/vkui";

export interface ModalSettingsProps extends ModalPageProps {
    onLoading(v: boolean): void;
}
