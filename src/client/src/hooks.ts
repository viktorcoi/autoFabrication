import { useEffect, useRef, useState } from "react";
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
