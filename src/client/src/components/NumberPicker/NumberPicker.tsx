'use client'

import {
    type ChangeEvent,
    type Ref,
    type SyntheticEvent,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import {Icon16Add, Icon16Minus} from "@vkontakte/icons";
import {Input, classNames, Button} from "@vkontakte/vkui";
import type {NumberPickerProps} from "@/components/NumberPicker/types";
import styles from "./NumberPicker.module.scss";

const DEFAULT_REPEAT_DELAY = 350;
const DEFAULT_REPEAT_INTERVAL = 80;

const normalizeRange = (min: number, max: number) => {
    const safeMin = Number.isFinite(min) ? min : 0;
    const safeMax = Number.isFinite(max) ? max : safeMin;

    return {
        min: Math.min(safeMin, safeMax),
        max: Math.max(safeMin, safeMax),
    };
};

const getPrecision = (...values: number[]) => values.reduce((precision, value) => {
    if (!Number.isFinite(value)) {
        return precision;
    }

    const valueString = String(value);

    if (valueString.includes('e-')) {
        return Math.max(precision, Number(valueString.split('e-')[1] ?? 0));
    }

    const [, decimals = ''] = valueString.split('.');

    return Math.max(precision, decimals.length);
}, 0);

const roundNumber = (value: number, precision: number) => Number(value.toFixed(precision));

const clampNumber = (value: number, min: number, max: number, precision = 0) => {
    const clampedValue = Math.min(max, Math.max(min, value));

    return roundNumber(clampedValue, precision);
};

const sanitizeNumberText = (value: string) => {
    let nextValue = '';
    let hasSeparator = false;

    value.trim().split('').forEach((char) => {
        if ((char === '-' || char === '+') && nextValue.length === 0) {
            if (char === '-') {
                nextValue = char;
            }

            return;
        }

        if ((char === '.' || char === ',') && !hasSeparator) {
            nextValue += '.';
            hasSeparator = true;
            return;
        }

        if (char >= '0' && char <= '9') {
            nextValue += char;
        }
    });

    return nextValue;
};

const parseNumberText = (value: string) => {
    if (!value || value === '-' || value === '.' || value === '-.') {
        return null;
    }

    const parsedValue = Number(value);

    return Number.isFinite(parsedValue) ? parsedValue : null;
};

const formatNumber = (value: number) => String(value);

const setReactRef = <T,>(ref: Ref<T> | undefined, value: T | null) => {
    if (!ref) {
        return;
    }

    if (typeof ref === 'function') {
        ref(value);
        return;
    }

    (ref as { current: T | null }).current = value;
};

const NumberPicker = (props: NumberPickerProps) => {
    const {
        value,
        defaultValue,
        min,
        max,
        step = 1,
        hideButtons = false,
        loop = true,
        decrementLabel = 'Уменьшить',
        incrementLabel = 'Увеличить',
        decrementIcon = <Icon16Minus width={20} height={20}/>,
        incrementIcon = <Icon16Add width={20} height={20}/>,
        before,
        after,
        align = 'center',
        disabled = false,
        readOnly = false,
        className,
        onChange,
        onFocus,
        onBlur,
        onKeyDown,
        onWheel,
        onMouseEnter,
        onMouseLeave,
        slotProps,
        getRootRef,
        ...restProps
    } = props;

    const {min: safeMin, max: safeMax} = useMemo(() => normalizeRange(min, max), [max, min]);
    const safeStep = useMemo(() => {
        const normalizedStep = Number.isFinite(step) ? Math.abs(step) : 1;

        return normalizedStep > 0 ? normalizedStep : 1;
    }, [step]);
    const precision = useMemo(
        () => getPrecision(safeMin, safeMax, safeStep),
        [safeMax, safeMin, safeStep],
    );
    const isControlled = value !== undefined;
    const initialValue = clampNumber(
        value ?? defaultValue ?? safeMin,
        safeMin,
        safeMax,
        precision,
    );

    const [innerValue, setInnerValue] = useState(initialValue);
    const [inputValue, setInputValue] = useState(formatNumber(initialValue));
    const [isFocused, setIsFocused] = useState(false);
    const [isHovered, setIsHovered] = useState(false);

    const valueRef = useRef(initialValue);
    const repeatDelayRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const repeatIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const ignoreClickRef = useRef(false);
    const rootRef = useRef<HTMLDivElement | null>(null);
    const handledWheelEventRef = useRef<WheelEvent | null>(null);

    const currentValue = clampNumber(
        isControlled ? value : innerValue,
        safeMin,
        safeMax,
        precision,
    );
    const canChangeValue = !disabled && !readOnly;

    const stopRepeat = useCallback(() => {
        if (repeatDelayRef.current) {
            clearTimeout(repeatDelayRef.current);
            repeatDelayRef.current = null;
        }

        if (repeatIntervalRef.current) {
            clearInterval(repeatIntervalRef.current);
            repeatIntervalRef.current = null;
        }
    }, []);

    const updateValue = useCallback((
        nextValue: number,
        event?: SyntheticEvent,
        updateInput = true,
    ) => {
        const normalizedValue = clampNumber(nextValue, safeMin, safeMax, precision);
        const previousValue = valueRef.current;

        valueRef.current = normalizedValue;

        if (!isControlled) {
            setInnerValue(normalizedValue);
        }

        if (updateInput) {
            setInputValue(formatNumber(normalizedValue));
        }

        if (normalizedValue !== previousValue) {
            onChange?.(normalizedValue, event);
        }
    }, [isControlled, onChange, precision, safeMax, safeMin]);

    const getNextValue = useCallback((direction: 1 | -1) => {
        const nextValue = roundNumber(valueRef.current + safeStep * direction, precision);

        if (!loop) {
            return clampNumber(nextValue, safeMin, safeMax, precision);
        }

        if (nextValue > safeMax) {
            return safeMin;
        }

        if (nextValue < safeMin) {
            return safeMax;
        }

        return nextValue;
    }, [loop, precision, safeMax, safeMin, safeStep]);

    const changeByStep = useCallback((direction: 1 | -1, event?: SyntheticEvent) => {
        if (!canChangeValue) {
            return;
        }

        updateValue(getNextValue(direction), event);
    }, [canChangeValue, getNextValue, updateValue]);

    const commitInput = useCallback((event?: SyntheticEvent) => {
        const parsedValue = parseNumberText(inputValue);
        const nextValue = parsedValue === null ? valueRef.current : parsedValue;

        updateValue(nextValue, event);
    }, [inputValue, updateValue]);

    const startRepeat = useCallback((direction: 1 | -1, event: SyntheticEvent) => {
        if (!canChangeValue) {
            return;
        }

        stopRepeat();
        changeByStep(direction, event);

        repeatDelayRef.current = setTimeout(() => {
            repeatIntervalRef.current = setInterval(() => {
                changeByStep(direction);
            }, DEFAULT_REPEAT_INTERVAL);
        }, DEFAULT_REPEAT_DELAY);
    }, [canChangeValue, changeByStep, stopRepeat]);

    useEffect(() => {
        const normalizedValue = clampNumber(currentValue, safeMin, safeMax, precision);

        valueRef.current = normalizedValue;

        if (!isControlled && normalizedValue !== innerValue) {
            setInnerValue(normalizedValue);
        }

        if (!isFocused) {
            setInputValue(formatNumber(normalizedValue));
        }
    }, [currentValue, innerValue, isControlled, isFocused, precision, safeMax, safeMin]);

    useEffect(() => stopRepeat, [stopRepeat]);

    useEffect(() => {
        const rootElement = rootRef.current;

        if (!rootElement) {
            return;
        }

        const handleNativeWheel = (event: WheelEvent) => {
            if (!canChangeValue || !isFocused || !isHovered) {
                return;
            }

            handledWheelEventRef.current = event;
            event.preventDefault();
            event.stopPropagation();
            event.stopImmediatePropagation();
            changeByStep(event.deltaY < 0 ? 1 : -1);
        };

        rootElement.addEventListener('wheel', handleNativeWheel, {
            capture: true,
            passive: false,
        });

        return () => {
            rootElement.removeEventListener('wheel', handleNativeWheel, {
                capture: true,
            });
        };
    }, [canChangeValue, changeByStep, isFocused, isHovered]);

    const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
        const nextInputValue = sanitizeNumberText(event.target.value);
        const parsedValue = parseNumberText(nextInputValue);

        setInputValue(nextInputValue);

        if (parsedValue !== null && parsedValue >= safeMin && parsedValue <= safeMax) {
            updateValue(parsedValue, event, false);
        }
    };

    const handleFocus: NumberPickerProps['onFocus'] = (event) => {
        setIsFocused(true);
        onFocus?.(event);
    };

    const handleBlur: NumberPickerProps['onBlur'] = (event) => {
        setIsFocused(false);
        commitInput(event);
        onBlur?.(event);
    };

    const handleKeyDown: NumberPickerProps['onKeyDown'] = (event) => {
        onKeyDown?.(event);

        if (event.defaultPrevented || !canChangeValue) {
            return;
        }

        if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
            event.preventDefault();
            changeByStep(event.key === 'ArrowUp' ? 1 : -1, event);
            return;
        }

        if (event.key === 'Enter') {
            commitInput(event);
        }
    };

    const handleWheel: NumberPickerProps['onWheel'] = (event) => {
        if (event.nativeEvent === handledWheelEventRef.current) {
            handledWheelEventRef.current = null;
            return;
        }

        onWheel?.(event);

        if (event.defaultPrevented || !canChangeValue || !isFocused || !isHovered) {
            return;
        }

        event.preventDefault();
        event.stopPropagation();
        changeByStep(event.deltaY < 0 ? 1 : -1, event);
    };

    const handleMouseEnter: NumberPickerProps['onMouseEnter'] = (event) => {
        setIsHovered(true);
        onMouseEnter?.(event);
    };

    const handleMouseLeave: NumberPickerProps['onMouseLeave'] = (event) => {
        setIsHovered(false);
        onMouseLeave?.(event);
    };

    const setRootRef = useCallback((node: HTMLDivElement | null) => {
        rootRef.current = node;
        setReactRef(getRootRef, node);
    }, [getRootRef]);

    const renderButton = (direction: 1 | -1) => {
        const icon = direction === 1 ? incrementIcon : decrementIcon;
        const isBoundaryReached = !loop && (
            direction === 1
                ? currentValue >= safeMax
                : currentValue <= safeMin
        );
        const isButtonDisabled = !canChangeValue || isBoundaryReached;

        return (
            <Button
                mode={'tertiary'}
                size={'m'}
                after={icon}
                className={classNames(isButtonDisabled && 'disabled')}
                onPointerDown={(event) => {
                    ignoreClickRef.current = true;
                    event.currentTarget.setPointerCapture?.(event.pointerId);
                    startRepeat(direction, event);
                }}
                onPointerUp={stopRepeat}
                onPointerLeave={stopRepeat}
                onPointerCancel={stopRepeat}
                onLostPointerCapture={stopRepeat}
                onClick={(event) => {
                    if (ignoreClickRef.current) {
                        ignoreClickRef.current = false;
                        return;
                    }

                    changeByStep(direction, event);
                }}
            />
        );
    };

    const beforeNode = hideButtons && !before ? undefined : (
        <div className={styles.slot}>
            {!hideButtons && renderButton(-1)}
            {before}
        </div>
    );
    const afterNode = hideButtons && !after ? undefined : (
        <div className={styles.slot}>
            {after}
            {!hideButtons && renderButton(1)}
        </div>
    );

    return (
        <Input
            {...restProps}
            className={classNames(styles.root, className)}
            align={align}
            type={'text'}
            inputMode={'decimal'}
            min={safeMin}
            max={safeMax}
            step={safeStep}
            value={inputValue}
            getRootRef={setRootRef}
            disabled={disabled}
            readOnly={readOnly}
            before={beforeNode}
            after={afterNode}
            onChange={handleInputChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            onWheel={handleWheel}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            slotProps={{
                ...slotProps,
                input: {
                    ...slotProps?.input,
                    role: 'spinbutton',
                    'aria-valuemin': safeMin,
                    'aria-valuemax': safeMax,
                    'aria-valuenow': currentValue,
                },
            }}
        />
    );
};

export default NumberPicker;
