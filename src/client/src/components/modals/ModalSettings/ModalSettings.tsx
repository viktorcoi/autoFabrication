import {
    Button,
    classNames,
    FormItem,
    FormLayoutGroup,
    ModalPage,
    ModalPageHeader, ModalPageProps,
    PlatformProvider,
    Select,
    SimpleCell,
    Switch
} from "@vkontakte/vkui";
import styles from './ModalSettings.module.scss';
import {SubmitEvent, useState} from "react";
import {useAppStore} from "@/store/app/app";
import {useSnackbarStore} from "@/store/snackbar/snackbar";
import {SnackbarPlacementType} from "@/store/snackbar/types";
import NumberPicker from "@/components/NumberPicker/NumberPicker";
import {
    initField,
    isValidConfirmPassword,
    isValidPassword
} from "@/components/modals/ModalSettings/helpers";
import PasswordInput from "@/components/PasswordInput/PasswordInput";
import {ApiService} from "@/apiService/apiService";

const ModalSettings = (props: ModalPageProps) => {

    const {
        preventClose,
        ...restProps
    } = props;

    const {
        theme,
        toggleTheme,
        storageSettings,
        setStorageSetting,
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

    const [loading, setLoading] = useState(false);
    const [activeSection, setActiveSection] = useState(0);
    const [password, setPassword] = useState(initField);
    const [newPassword, setNewPassword] = useState(initField);
    const [confirmNewPassword, setConfirmNewPassword] = useState(initField);

    const savePassword = async (e: SubmitEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!password.isValid || !newPassword.isValid || !confirmNewPassword.isValid) return;

        setLoading(true);

        await ApiService.auth.changePassword({
            options: {
                oldPassword: password.value,
                newPassword: newPassword.value,
            },
        }).then(({status}) => {
            if (status === 'success') {
                addSnackbar({
                    type: 'success',
                    text: 'Пароль успешно изменен',
                });
                setPassword(initField);
                setNewPassword(initField);
                setConfirmNewPassword(initField);
            }
        }).finally(() => setLoading(false));
    };

    return (
        <ModalPage
            height={640}
            hideCloseButton={loading}
            preventClose={preventClose || loading}
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
                        className={classNames(
                            activeSection === key && 'activated',
                            loading && 'disabled',
                        )}
                        key={key}
                        onClick={() => setActiveSection(key)}
                    >
                        {s}
                    </SimpleCell>
                ))}
            </div>

                {activeSection === 0 ? (
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
                                    after={(
                                        <Switch
                                            checked={storageSettings.saveSearch}
                                            onChange={(event) => setStorageSetting('saveSearch', event.target.checked)}
                                        />
                                    )}
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
                                after={(
                                    <Switch
                                        checked={storageSettings.saveFilters}
                                        onChange={(event) => setStorageSetting('saveFilters', event.target.checked)}
                                    />
                                )}
                                mode={'secondary'}
                            >
                                Сохранять фильтры для таблиц
                            </Button>
                            <Button
                                className={styles.label}
                                stretched={true}
                                Component={'label'}
                                size={'m'}
                                after={(
                                    <Switch
                                        checked={storageSettings.saveTableSettings}
                                        onChange={(event) => setStorageSetting('saveTableSettings', event.target.checked)}
                                    />
                                )}
                                mode={'secondary'}
                            >
                                Сохранять сортировку колонок для таблиц
                            </Button>
                            <Button
                                className={styles.label}
                                stretched={true}
                                Component={'label'}
                                size={'m'}
                                after={(
                                    <Switch
                                        checked={storageSettings.saveTableRows}
                                        onChange={(event) => setStorageSetting('saveTableRows', event.target.checked)}
                                    />
                                )}
                                mode={'secondary'}
                            >
                                Сохранять лимит строк для таблиц
                            </Button>
                        </div>
                    </div>
                ) : activeSection === 1 && (
                    <>
                        <form
                            className={styles.settings}
                            onSubmit={savePassword}
                            id={'save-password'}
                        >
                            <FormItem
                                top={'Текущий пароль'}
                                noPadding={true}
                                status={!password.isValid ? 'error' : 'default'}
                                bottom={password.textError}
                            >
                                <PasswordInput
                                    tabIndex={1}
                                    maxLength={30}
                                    disabled={loading}
                                    placeholder={'Введите текущий пароль'}
                                    value={password.value}
                                    onChange={({target: {value}}) => setPassword(isValidPassword(value))}
                                />
                            </FormItem>
                            <FormItem
                                top={'Новый пароль'}
                                noPadding={true}
                                bottom={newPassword.textError}
                                status={!newPassword.isValid ? 'error' : 'default'}
                            >
                                <PasswordInput
                                    tabIndex={2}
                                    disabled={loading}
                                    placeholder={'Введите новый пароль'}
                                    value={newPassword.value}
                                    maxLength={30}
                                    onChange={({target: {value}}) => {
                                        if (confirmNewPassword.value.length)
                                        setConfirmNewPassword(isValidConfirmPassword(confirmNewPassword.value, value))
                                        setNewPassword(isValidPassword(value))
                                    }}
                                />
                            </FormItem>
                            <FormItem
                                top={'Повторите новый пароль'}
                                noPadding={true}
                                bottom={confirmNewPassword.textError}
                                status={!confirmNewPassword.isValid ? 'error' : 'default'}
                            >
                                <PasswordInput
                                    tabIndex={3}
                                    disabled={loading}
                                    placeholder={'Введите новый пароль еще раз'}
                                    value={confirmNewPassword.value}
                                    maxLength={30}
                                    onChange={({target: {value}}) => setConfirmNewPassword(
                                        isValidConfirmPassword(value, newPassword.value)
                                    )}
                                />
                            </FormItem>
                            <Button
                                type={'submit'}
                                size={'m'}
                                loading={loading}
                                disabled={!password.isValid || !newPassword.isValid || !confirmNewPassword.isValid}
                            >
                                Сохранить
                            </Button>
                        </form>
                    </>
                )}
        </ModalPage>
    )
};

export default ModalSettings;
