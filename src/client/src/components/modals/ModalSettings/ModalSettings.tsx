import {
    Button,
    classNames,
    FormItem, FormLayoutGroup, Text,
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
import {Icon24View} from "@vkontakte/icons";
import NumberPicker from "@/components/NumberPicker/NumberPicker";

const ModalSettings = (props: ModalPageProps) => {

    const {
        ...restProps
    } = props;

    const {
        theme,
        toggleTheme,
    } = useAppStore(s => s);

    const {
        time,
        count,
        placement,
        changeTime,
        changeCount,
        addSnackbar,
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
                            top={'Настройка темы'}
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
                        <div className={styles.settings__item}>
                            <FormItem
                                top={'Настройки всплывающих сообщений'}
                                noPadding={true}
                            >
                                <div className={styles.site}>
                                    <div className={styles.site__left}/>
                                    <div className={styles.site__right}>
                                        <div className={styles.site__top}/>
                                        <div className={styles.site__bottom} />
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
                                            {Array.from({ length: count }).map((_, i) => (
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
                            <FormLayoutGroup
                                mode={'horizontal'}
                                noPadding={true}
                            >
                                <FormItem
                                    top={'Лимит сообщений'}
                                    noPadding={true}
                                >
                                    <NumberPicker
                                        value={count}
                                        loop={false}
                                        min={1}
                                        max={5}
                                        onChange={changeCount}
                                    />
                                </FormItem>
                                <FormItem
                                    top={'Время отображения'}
                                    noPadding={true}
                                >
                                    <NumberPicker
                                        value={time / 1000}
                                        loop={false}
                                        min={1}
                                        max={60}
                                        onChange={t => changeTime(t * 1000)}
                                    />
                                </FormItem>
                            </FormLayoutGroup>
                            <Button
                                mode={'secondary'}
                                size={'m'}
                                className={styles.site__button}
                                onClick={() => {
                                    addSnackbar({
                                        type: 'info',
                                        text: 'Тестовое сообщение'
                                    })
                                }}
                            >
                                Вызвать вспывающее сообщение
                            </Button>
                        </div>
                        <div className={styles.settings__item}>
                            <FormItem noPadding={true} top={'Настройки сохранений'}>
                                <Button
                                    className={styles.label}
                                    stretched={true}
                                    Component={'label'}
                                    size={'m'}
                                    after={<Switch/>}
                                    mode={'secondary'}
                                >
                                    Сохранять поиск по совпадениям
                                </Button>
                            </FormItem>
                            <Button
                                className={styles.label}
                                stretched={true}
                                Component={'label'}
                                size={'m'}
                                after={<Switch/>}
                                mode={'secondary'}
                            >
                                Сохранять фильтры для таблиц
                            </Button>
                            <Button
                                className={styles.label}
                                stretched={true}
                                Component={'label'}
                                size={'m'}
                                after={<Switch/>}
                                mode={'secondary'}
                            >
                                Сохранять сортировку колонок для таблиц
                            </Button>
                            <Button
                                className={styles.label}
                                stretched={true}
                                Component={'label'}
                                size={'m'}
                                after={<Switch/>}
                                mode={'secondary'}
                            >
                                Сохранять лимит строк для таблиц
                            </Button>
                        </div>
                    </div>
                )}
        </ModalPage>
    )
};

export default ModalSettings;
