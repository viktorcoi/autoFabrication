"use client";

import {PropsWithChildren, useEffect, useState} from "react";
import { AdaptivityProvider, AppRoot, ConfigProvider } from "@vkontakte/vkui";
import SnackbarProvider from "@/components/SnackbarProvider/SnackbarProvider";
import { useAppStore } from "@/store/app/app";
import LoadingPage from "@/system/loading/page";

const Wrapper = ({ children }: PropsWithChildren) => {

    const {
        user,
        getUser,
        appReady,
        theme,
        initializeApp
    } = useAppStore((state) => state);

    const [loading, setLoading] = useState(true);

    useEffect(() => {
        initializeApp();

        if (!user) {
            getUser().finally(() => setLoading(false));
        }
    }, []);

    useEffect(() => {
        if (!appReady) {
            return;
        }

        document
            .querySelectorAll('[data-element-for-preload="true"]')
            .forEach((item) => item.remove());
    }, [appReady]);

    if (!appReady) {
        return null;
    }

    return (
        <ConfigProvider
            platform={'vkcom'}
            colorScheme={theme}
        >
            <AdaptivityProvider density={'compact'}>
                <AppRoot
                    disableSettingVKUIClassesInRuntime={true}
                >
                    <SnackbarProvider>
                        {loading ? <LoadingPage/> : children}
                    </SnackbarProvider>
                </AppRoot>
            </AdaptivityProvider>
        </ConfigProvider>
    );
};

export default Wrapper;
