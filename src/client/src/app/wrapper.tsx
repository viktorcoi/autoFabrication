"use client";

import {PropsWithChildren, ReactNode, useEffect, useRef, useState} from "react";
import { AdaptivityProvider, AppRoot, ConfigProvider } from "@vkontakte/vkui";
import SnackbarProvider from "@/components/SnackbarProvider/SnackbarProvider";
import { useAppStore } from "@/store/app/app";
import {ApiService} from "@/apiService/apiService";
import LoginPage from "@/system/auth/page";
import LoadingPage from "@/system/loading/page";
import Navigation from "@/components/Navigation/Navigation";
import styles from './wrapper.module.scss';

const Wrapper = ({ children }: PropsWithChildren) => {

    const {
        user,
        setUser,
        appReady,
        theme,
        initializeApp
    } = useAppStore((state) => state);

    const [loading, setLoading] = useState(true);

    useEffect(() => {
        initializeApp();

        if (!user) {
            ApiService.auth.me({}).then(async ({status, data}) => {
                if (status === 'success') {
                    setUser(data);
                }
            }).finally(() => setLoading(false));
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
        <ConfigProvider colorScheme={theme}>
            <AdaptivityProvider>
                <AppRoot
                    disableSettingVKUIClassesInRuntime={true}
                >
                    <SnackbarProvider>
                        {loading ? <LoadingPage/> :
                            (!user ? (
                                <LoginPage/>
                            ) : (
                                <div
                                    className={styles.wrap}
                                >
                                    <Navigation/>
                                    {children}
                                </div>
                            ))
                        }
                    </SnackbarProvider>
                </AppRoot>
            </AdaptivityProvider>
        </ConfigProvider>
    );
};

export default Wrapper;
