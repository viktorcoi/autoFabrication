import type {InputProps} from "@vkontakte/vkui";
import type {ReactNode, SyntheticEvent} from "react";

export interface NumberPickerProps extends Omit<InputProps, 'type' | 'value' | 'defaultValue' | 'onChange' | 'min' | 'max' | 'step'> {
    value?: number;
    defaultValue?: number;
    min: number;
    max: number;
    step?: number;
    hideButtons?: boolean;
    loop?: boolean;
    decrementLabel?: string;
    incrementLabel?: string;
    decrementIcon?: ReactNode;
    incrementIcon?: ReactNode;
    onChange?: (value: number, event?: SyntheticEvent) => void;
}
