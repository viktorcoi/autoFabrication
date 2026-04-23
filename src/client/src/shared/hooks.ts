import {ChangeEvent, useCallback, useEffect, useRef, useState} from "react";
import {CustomSelectOptionInterface, filterFnForSelect} from "@vkontakte/vkui";
import {useAppStore} from "@/store/app/app";

export const useSearch = (loading: boolean) => {
    const delay = useAppStore(state => state.delaySearch);

    const [search, setSearch] = useState('');
    const [delaySearch, setDelaySearch] = useState('');

    const inputRef = useRef<HTMLInputElement | null>(null);
    const shouldRestoreFocusRef = useRef(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (
                inputRef.current &&
                document.activeElement === inputRef.current &&
                search !== delaySearch
            ) {
                shouldRestoreFocusRef.current = true;
            }

            setDelaySearch(search);
        }, delay);

        return () => clearTimeout(timer);
    }, [delay, delaySearch, search]);

    useEffect(() => {
        if (!loading && shouldRestoreFocusRef.current) {
            const restoreTimer = window.setTimeout(() => {
                inputRef.current?.focus();
                shouldRestoreFocusRef.current = false;
            }, 0);

            return () => window.clearTimeout(restoreTimer);
        }
    }, [loading]);

    return {
        search,
        setSearch,
        delaySearch,
        inputRef,
    };
};

type UseSelectFilterType<Option extends CustomSelectOptionInterface> = {
    filterFn?: (inputValue: string, option: Option) => boolean;
    onInputChange?: (event: ChangeEvent<HTMLInputElement>) => void;
    onOpen?: VoidFunction;
    onClose?: VoidFunction;
};

export const useSelectFilter = ({
    filterFn = filterFnForSelect as (inputValue: string, option: CustomSelectOptionInterface) => boolean,
    onInputChange,
    onOpen,
    onClose,
}: UseSelectFilterType<CustomSelectOptionInterface> = {}) => {
    const [shouldFilter, setShouldFilter] = useState(false);

    const handleOpen = useCallback(() => {
        setShouldFilter(false);
        onOpen?.();
    }, [onOpen]);

    const handleClose = useCallback(() => {
        setShouldFilter(false);
        onClose?.();
    }, [onClose]);

    const handleInputChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
        setShouldFilter(true);
        onInputChange?.(event);
    }, [onInputChange]);

    const handleFilter = useCallback((inputValue: string, option: CustomSelectOptionInterface) => {
        if (!shouldFilter) {
            return true;
        }

        return filterFn(inputValue, option);
    }, [filterFn, shouldFilter]);

    return {
        filterFn: handleFilter,
        onInputChange: handleInputChange,
        onOpen: handleOpen,
        onClose: handleClose,
        shouldFilter,
    };
};

export const useController = (
    abort: (object | string | number | null)[]
) => {

    const controllerRef = useRef<AbortController>(null);
    const cancelRef = useRef(false);

    const createController = () => {
        const controller = new AbortController();
        controllerRef.current = controller;
        return controller;
    };

    useEffect(() => {
        return () => {
            controllerRef.current?.abort();
        }
    }, [...abort]);

    return {
        controllerRef,
        cancelRef,
        createController,
    };
};
