import {
    ChangeEvent,
    Dispatch,
    SetStateAction,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState
} from "react";
import {CustomSelectOptionInterface, filterFnForSelect} from "@vkontakte/vkui";
import {useAppStore} from "@/store/app/app";

export const useSearch = (loading: boolean, storageKey?: string) => {
    const delay = useAppStore(state => state.delaySearch);
    const saveSearch = useAppStore(state => state.storageSettings.saveSearch);
    const getPageStorage = useAppStore(state => state.getPageStorage);
    const setPageStorage = useAppStore(state => state.setPageStorage);

    const [search, setSearch] = useState(() => {
        if (!storageKey || !saveSearch) {
            return '';
        }

        const storedSearch = getPageStorage<{search?: string}>(storageKey).search;

        return typeof storedSearch === 'string' ? storedSearch : '';
    });
    const [delaySearch, setDelaySearch] = useState(search);

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

    useEffect(() => {
        if (!storageKey || !saveSearch) {
            return;
        }

        setPageStorage(storageKey, {search});
    }, [saveSearch, search, setPageStorage, storageKey]);

    return {
        search,
        setSearch,
        delaySearch,
        inputRef,
    };
};

const getStoredFilters = <T extends Record<string, number | Date | null>>(
    storedFilters: unknown,
    defaultFilters: T,
): T => {
    if (!storedFilters || typeof storedFilters !== 'object' || Array.isArray(storedFilters)) {
        return defaultFilters;
    }

    return Object.entries(defaultFilters).reduce<T>((result, [key, defaultValue]) => {
        const value = (storedFilters as Record<string, unknown>)[key];

        result[key as keyof T] = (
            typeof value === 'number' && Number.isFinite(value)
                ? value
                : defaultValue
        ) as T[keyof T];

        return result;
    }, {...defaultFilters});
};

export const useStoredFilters = <T extends Record<string, number | Date | null>>(
    storageKey: string,
    defaultFilters: T,
): [T, Dispatch<SetStateAction<T>>] => {
    const saveFilters = useAppStore(state => state.storageSettings.saveFilters);
    const getPageStorage = useAppStore(state => state.getPageStorage);
    const setPageStorage = useAppStore(state => state.setPageStorage);

    const [filters, setFilters] = useState<T>(() => {
        if (!saveFilters) {
            return defaultFilters;
        }

        return getStoredFilters(
            getPageStorage<{filters?: unknown}>(storageKey).filters,
            defaultFilters,
        );
    });

    useEffect(() => {
        if (!saveFilters) {
            return;
        }

        setPageStorage(storageKey, {filters});
    }, [filters, saveFilters, setPageStorage, storageKey]);

    return [filters, setFilters];
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

export const useFilersCount = (
    filters: Record<string, number | Date | null>,
) => {

    return useMemo(() => {
        let count = 0;

        Object.values(filters).forEach((filter) => {
            if (typeof filter === 'number' && filter > 0) count++;
            else if (filter !== null) count++;
        });

        return count;
    }, [filters]);
};
