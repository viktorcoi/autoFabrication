import {ActionSheet, ActionSheetItem, Avatar, classNames, Separator, SimpleCell} from "@vkontakte/vkui";
import Link from "next/link";
import {
    Icon16Lock,
    Icon16LockOpen,
    Icon20DoorArrowRightOutline,
    Icon20MoonOutline,
    Icon20SunOutline,
    Icon28SettingsOutline
} from "@vkontakte/icons";
import {usePathname} from "next/navigation";
import {useAppStore} from "@/store/app/app";
import React, {ReactNode, useMemo, useRef, useState} from "react";
import {ApiService} from "@/apiService/apiService";
import styles from './Navigation.module.scss';
import ModalShowErrors from "@/components/modals/ModalShowErrors/ModalShowErrors";
import {useShowErrors} from "@/store/showErrors/showErrors";
import {OpenModalsType} from "@/components/modals/types";
import ModalFiltersUsers from "@/components/modals/ModalFilters/ModalFiltersUsers/ModalFiltersUsers";
import ModalSettings from "@/components/modals/ModalSettings/ModalSettings";
import {mergeState} from "@/shared/helpers";

const Navigation = () => {

    const {
        user,
        role,
        theme,
        toggleTheme,
        navigations,
        // TODO - (PERMISSIONS/ACCESS/ДОСТУП) dev режим защиты
        TEST,
        toggleTEST,
    } = useAppStore(state => state);
    const showErrors = useShowErrors(state => state);

    const pathname = usePathname();
    const [loading, setLoading] = useState(false);

    const [modals, setModals] = useState<OpenModalsType<
        'modal-settings'
    >>({id: null, show: false, data: null});
    const [actionSheet, setActionSheet] = useState<ReactNode>(null);
    const menuRef = useRef(null);

    const logout = async () => {
        await ApiService.auth.logout({}).then(({status}) => {
            if (status === 'success') {
                window.location.reload();
            }
        })
    };

    const openMenu = () => {
        setActionSheet(
            <ActionSheet
                placement={'top-start'}
                popupOffsetDistance={8}
                toggleRef={menuRef}
                onClosed={() => setActionSheet(null)}
            >
                {/* TODO - (PERMISSIONS/ACCESS/ДОСТУП) dev режим защиты */}
                <ActionSheetItem
                    onClick={toggleTEST}
                    before={TEST ? <Icon16LockOpen width={20} height={20}/> : <Icon16Lock width={20} height={20}/>}
                >
                    {`${TEST ? 'Отключить' : 'Включить'} обработку доступа`}
                </ActionSheetItem>


                <ActionSheetItem
                    before={<Icon28SettingsOutline width={20} height={20}/>}
                    onClick={() => mergeState({id: 'modal-settings', show: true}, setModals)}
                >
                    Настройки
                </ActionSheetItem>
                <ActionSheetItem
                    onClick={toggleTheme}
                    before={theme === 'dark' ? <Icon20SunOutline/> : <Icon20MoonOutline/>}
                >
                    {`${theme === 'dark' ? 'Светлая' : 'Темная'} тема`}
                </ActionSheetItem>
                <ActionSheetItem
                    onClick={logout}
                    before={<Icon20DoorArrowRightOutline/>}
                >
                    Выход
                </ActionSheetItem>
            </ActionSheet>,
        );
    }

    const rootPath = useMemo(() => `/${pathname.split("/")[1] ?? ""}`, [pathname]);

    return (
        <>
            {'modal-settings' === modals.id && (
                <ModalSettings
                    onLoading={setLoading}
                    open={modals.show}
                    onClose={() => mergeState({show: false}, setModals)}
                    onClosed={() => setModals({id: null, show: false, data: null})}

                />
            )}
            {showErrors.render && (
                <ModalShowErrors open={showErrors.show}/>
            )}
            <div className={classNames(
                'island',
                styles.wrap
            )}>
                {actionSheet}
                <div className={classNames('scroll', styles.nav)}>
                    {navigations.map(({name, url, icon}, key) => {
                        if (name === 'separator') return key !== 0 ? (
                            <Separator key={key} />
                        ) : null;
                        return (
                            <Link
                                key={key}
                                href={url}
                                className={classNames(url === rootPath && 'activated')}
                            >
                                <SimpleCell
                                    activated={url === rootPath}
                                    onClick={() => {}}
                                    before={icon}
                                >
                                    {name}
                                </SimpleCell>
                            </Link>
                        )
                    })}
                </div>
                    <SimpleCell
                        getRootRef={menuRef}
                        onClick={openMenu}
                        className={styles.user}
                        subtitle={role?.name}
                        before={(
                            <Avatar
                                src={user?.avatarUrl ?? ''}
                                initials={`${user?.lastName?.[0]}${user?.firstName?.[0]}`}
                                size={36}
                            />
                        )}
                    >
                        {`${user?.lastName} ${user?.firstName} ${user?.middleName ?? ''}`}
                    </SimpleCell>
            </div>
        </>
    )
};

export default Navigation;
