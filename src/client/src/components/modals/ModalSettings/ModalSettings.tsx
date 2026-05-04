import {
    Button,
    classNames,
    FormItem,
    ModalPage,
    ModalPageHeader,
    ModalPageProps,
    PlatformProvider, Select,
    SimpleCell, Switch
} from "@vkontakte/vkui";
import styles from './ModalSettings.module.scss';
import {useState} from "react";
import {useAppStore} from "@/store/app/app";
import {useSnackbarStore} from "@/store/snackbar/snackbar";
import {SnackbarPlacementType} from "@/store/snackbar/types";

const ModalSettings = (props: ModalPageProps) => {

    const {
        ...restProps
    } = props;

    const {
        theme,
        toggleTheme,
    } = useAppStore(s => s);

    const {
        addSnackbar,
        placement,
        changePlacement
    } = useSnackbarStore(s => s);

    const [activeSection, setActiveSection] = useState(0);

    return (
        <ModalPage
            height={500}
            className={styles.modal}
            header={
                <PlatformProvider value={'ios'}>
                    <ModalPageHeader>Настройки</ModalPageHeader>
                </PlatformProvider>
            }
            {...restProps}
        >
            <div className={styles.wrap}>
                <div className={styles.sections}>
                    {['Настройки системы', 'Изменить пароль'].map((s, key) => (
                        <SimpleCell
                            activated={activeSection === key}
                            className={classNames(activeSection === key && 'activated')}
                            key={key}
                            onClick={() => setActiveSection(key)}
                        >
                            {s}
                        </SimpleCell>
                    ))}
                </div>
                {activeSection === 0 && (
                    <div className={styles.settings}>
                        <FormItem
                            top={'Цветовое оформление'}
                            noPadding={true}
                        >
                            <Select
                                value={theme}
                                options={[
                                    {value: 'light', label: 'Светлая тема'},
                                    {value: 'dark', label: 'Темная тема'},
                                ]}
                                onChange={toggleTheme}
                            />
                        </FormItem>
                        <FormItem
                            top={'Положение всплывающих сообщений'}
                            noPadding={true}
                        >
                            <div className={styles.site}>
                                <div className={styles.site__left}/>
                                <div className={styles.site__right}>
                                    <div className={styles.site__top}/>
                                    <div className={styles.site__bottom} />
                                    <Button onClick={() => {
                                        addSnackbar({
                                            type: 'info',
                                            text: 'AAAA'
                                        })
                                    }}>?</Button>
                                </div>
                                {['top-start', 'top-end', 'bottom-start', 'bottom-end'].map((position) => (
                                    <div
                                        key={position}
                                        className={classNames(
                                            styles.site__side,
                                            styles[`site__side--${position}`],
                                            placement === position && styles['site__side--active']
                                        )}
                                        onClick={() => changePlacement(position as SnackbarPlacementType)}
                                    >
                                        {Array.from({ length: 3 }).map((_, i) => (
                                            <div
                                                key={i}
                                                className={styles['site__toast']}
                                            >
                                                <div className={styles['site__toast-icon']}/>
                                                <div>
                                                    <div className={styles['site__toast-desc']}/>
                                                    <div className={styles['site__toast-title']}/>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ))}
                            </div>
                        </FormItem>
                        <FormItem
                            top={'Количество всплывающих сообщений одновременно'}
                            noPadding={true}
                        >

                        </FormItem>
                        <SimpleCell
                            Component={'label'}
                            onClick={() => {}}
                            after={<Switch/>}
                        >
                            Сохранение фильтров для таблиц
                        </SimpleCell>
                    </div>
                )}
            </div>
        </ModalPage>
    )
};

export default ModalSettings;