import { useEffect, useState } from "react";

const DEFAULT_DALAY_SEACRH = 500;

export const useSearch = () => {

    const [search, setSearch] = useState('');
    const [delaySearch, setDelaySearch] = useState('');

    useEffect(() => {
        const timer = setTimeout(() => {
            setDelaySearch(search);
        }, DEFAULT_DALAY_SEACRH);

        return () => clearTimeout(timer);
    }, [search, DEFAULT_DALAY_SEACRH]);

    return {
        search,
        setSearch,
        delaySearch,
    };
};
