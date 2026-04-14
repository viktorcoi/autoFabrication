import styles from './Navigation.module.scss';
import {ActionSheet, ActionSheetItem, Avatar, classNames, Popover, Separator, SimpleCell} from "@vkontakte/vkui";
import Link from "next/link";
import {
    Icon20DoorArrowRightOutline,
    Icon20MoonOutline,
    Icon20SunOutline,
    Icon20UsersOutline,
    Icon20WrenchOutline,
    Icon24BriefcaseOutline, Icon28SettingsOutline
} from "@vkontakte/icons";
import {usePathname} from "next/navigation";
import {useAppStore} from "@/store/app/app";
import {ReactNode, useMemo, useRef, useState} from "react";
import {ApiService} from "@/apiService/apiService";

const navigations = [
    {
        name: 'Роли пользователей',
        url: '/roles',
        icon: <Icon24BriefcaseOutline fill={'var(--vkui--color_text_primary)'} width={20} height={20}/>,
    },
    {
        name: 'Пользователи',
        url: '/users',
        icon: <Icon20UsersOutline fill={'var(--vkui--color_text_primary)'} width={20} height={20}/>,
    },
    {
        name: 'separator',
        icon: '',
        url: ''
    },
    {
        name: 'Изделия',
        url: '/products',
        icon: <Icon20WrenchOutline fill={'var(--vkui--color_text_primary)'} width={20} height={20}/>,
    }
]

const Navigation = () => {

    const {
        user,
        setUser,
        role,
        theme,
        toggleTheme
    } = useAppStore(state => state);

    const pathname = usePathname();

    const [actionSheet, setActionSheet] = useState<ReactNode>(null);
    const menuRef = useRef(null);

    const logout = async () => {
        await ApiService.auth.logout({}).then(({status}) => {
            if (status === 'success') {
                setUser(null);
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
                <ActionSheetItem
                    before={<Icon28SettingsOutline width={20} height={20}/>}
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
        <div className={styles.wrap}>
            {actionSheet}
            <div className={styles.nav}>
                {navigations.map(({name, url, icon}, key) => {
                    if (name === 'separator') return (
                        <Separator key={key} />
                    )
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
                            initials={`${user?.lastName?.[0]}${user?.firstName?.[0]}`}
                            size={36}
                        />
                    )}
                >
                    {`${user?.lastName} ${user?.firstName} ${user?.middleName ?? ''}`}
                </SimpleCell>
        </div>
    )
};

export default Navigation;
