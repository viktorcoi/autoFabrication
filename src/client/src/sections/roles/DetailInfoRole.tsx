import {DetailInfoRoleProps} from "@/sections/roles/types";
import {useEffect, useMemo, useState} from "react";
import {
    Button,
    ButtonGroup,
    Checkbox,
    classNames,
    FormStatus,
    Spinner,
    Tappable,
    Title,
    Text,
    InfoRow
} from "@vkontakte/vkui";
import {
    Icon24ChevronDown,
} from "@vkontakte/icons";
import styles from './DetailInfoRole.module.scss';
import {ApiService} from "@/apiService/apiService";
import {mergeState} from "@/shared/helpers";
import {
    GetByIdRoleResponse,
    RolePermissionFlagsType,
    RolePermissionSection,
} from "@/apiService/apiRoles/types";
import {useSnackbarStore} from "@/store/snackbar/snackbar";
import {useController} from "@/shared/hooks";
import {useAppStore} from "@/store/app/app";

const SECTION_TITLES: Record<RolePermissionSection["url"], string> = {
    "/roles": "Роли пользователей",
    "/users": "Пользователи",
    "/guide": "Справочник",
    "/products": "Изделия"
};

const ACCESS_TITLES = {
    view: "Просмотр",
    adding: "Добавление",
    changeAccess: "Управление доступом",
    editing: "Редактирование",
    removing: "Удаление",
    resetPassword: "Сброс пароля",
    viewProcess: 'Просмотр техпроцессов',
    addingProcess: 'Добавление техпроцессов',
    editingProcess: 'Редактирование техпроцессов',
    removingProcess: 'Удаление техпроцессов',
    changeDisabledProcess: 'Блокировка изменений техпроцессов'
} satisfies Record<string, string>;

const DetailInfoRole = (props: DetailInfoRoleProps) => {

    const {
        id,
        onLoading
    } = props;

    const addSnackbar = useSnackbarStore(state => state.addSnackbar);
    // TODO - (PERMISSIONS/ACCESS/ДОСТУП) dev режим защиты
    const { TEST, permissions, role, getUser } = useAppStore(s => s);

    const [savedData, setSavedData] = useState<GetByIdRoleResponse | null>(null);
    const [data, setData] = useState<GetByIdRoleResponse | null>(null);
    const [openedSections, setOpenedSections] = useState<number[]>([]);
    const [loading, setLoading] = useState({
        get: true,
        send: false,
    });

    const {
        cancelRef,
        createController
    } = useController([id]);

    useEffect(() => {
        mergeState({get: true}, setLoading);

        const controller = createController();

        ApiService.roles.getById({
            id,
            controller,
        }).then(({status, data}) => {
            if (status === 'success') {
                setSavedData(data);
                setData(data);
                cancelRef.current = false;
            } else if (data === 'canceled') {
                cancelRef.current = true;
            }
        }).finally(() => mergeState({get: cancelRef.current}, setLoading));

        return () => {
            setSavedData(null);
            setData(null);
            setOpenedSections([]);
        };
    }, [id]);

    const permissionSections = useMemo(
        () => data
            ? Object.entries(data.permissions) as unknown as [keyof GetByIdRoleResponse["permissions"], RolePermissionSection][]
            : [],
        [data],
    );

    const hasChanges = useMemo(() => {
        if (!savedData || !data) {
            return false;
        }

        return JSON.stringify(savedData.permissions) !== JSON.stringify(data.permissions);
    }, [data, savedData]);

    const updatePermission = (
        sectionKey: keyof GetByIdRoleResponse["permissions"],
        accessKey: string,
        checked: boolean,
    ) => {
        setData((prev) => {
            if (!prev) {
                return prev;
            }

            const section = prev.permissions[sectionKey];
            const nextAccess = {
                ...(section.access as Record<string, boolean>),
                [accessKey]: checked,
            };

            if (accessKey !== "view" && checked) {
                nextAccess.view = true;
            }

            if (accessKey === "view" && !checked) {
                Object.keys(nextAccess).forEach((key) => {
                    nextAccess[key] = false;
                });
            }

            return {
                ...prev,
                permissions: {
                    ...prev.permissions,
                    [sectionKey]: {
                        ...section,
                        access: nextAccess,
                    },
                },
            };
        });
    };

    const updateSectionPermissions = (
        sectionKey: keyof GetByIdRoleResponse["permissions"],
        checked: boolean,
    ) => {
        setData((prev) => {
            if (!prev) {
                return prev;
            }

            const section = prev.permissions[sectionKey];
            const nextAccess = Object.keys(section.access).reduce<Record<string, boolean>>((acc, key) => {
                acc[key] = checked;
                return acc;
            }, {});

            return {
                ...prev,
                permissions: {
                    ...prev.permissions,
                    [sectionKey]: {
                        ...section,
                        access: nextAccess,
                    },
                },
            };
        });
    };

    const toggleSection = (sectionKey: keyof GetByIdRoleResponse["permissions"]) => {
        if (openedSections.includes(sectionKey)) {
            setOpenedSections(prevState => prevState.filter((s) => s !== sectionKey));
        } else setOpenedSections(prevState => [...prevState, sectionKey]);
    };

    const savePermissions = async () => {
        if (!data || loading.send || !hasChanges) {
            return;
        }

        mergeState({send: true}, setLoading);
        onLoading(true);

        await ApiService.roles.permissions.patch({
            id,
            options: { permissions: data.permissions },
        }).then(async ({status, data}) => {
            if (status === 'success') {
                const nextData = data;

                setSavedData(nextData);
                setData(nextData);
                addSnackbar({
                    type: 'success',
                    text: `Права роли "${data.name}" успешно обновлены`,
                });

                if (data.id === role?.id) {
                    await getUser();
                }
            }
        }).finally(() => {
            mergeState({send: false}, setLoading);
            onLoading(false);
        });
    };

    // TODO - (PERMISSIONS/ACCESS/ДОСТУП) dev режим защиты
    const accessChanges = useMemo(
        () => (permissions.get('/roles') as RolePermissionFlagsType)?.changeAccess || !TEST,
        [TEST, permissions]
    );

    return (
        <div className={styles.wrap}>
            <div className={styles.head}>
                <Title level={'3'} weight={'2'}>Управление доступом</Title>
            </div>
            <div className={classNames('scroll', styles.access)}>
                {loading.get ? <Spinner size={'xl'} /> : (
                    <>
                        {!!data?.description && (
                            <FormStatus className={styles.status}>
                                <InfoRow header={'Описание'}>
                                    {data.description}
                                </InfoRow>
                            </FormStatus>
                        )}
                        <div className={styles.group}>
                            {permissionSections.map(([sectionKey, permission]) => {
                                const accessValues = Object.values(permission.access);
                                const checkedCount = accessValues.filter(Boolean).length;
                                const allChecked = checkedCount === accessValues.length;
                                const indeterminate = checkedCount > 0 && !allChecked;
                                const isOpened = openedSections.includes(sectionKey);

                                return (
                                    <div
                                        key={sectionKey}
                                        className={styles.section}
                                    >
                                        <Button
                                            mode={'tertiary'}
                                            className={styles.section__toggle}
                                            rounded={true}
                                            onClick={() => toggleSection(sectionKey)}
                                            after={(
                                                <Icon24ChevronDown
                                                    className={classNames(
                                                        styles.section__chevron,
                                                        isOpened && styles['section__chevron--opened']
                                                    )}
                                                    width={20}
                                                    height={20}
                                                />
                                            )}
                                        />
                                        <div className={styles.section__content}>
                                            <Tappable
                                                hasHoverWithChildren={true}
                                                Component={'label'}
                                                className={classNames(
                                                    styles.section__root,
                                                    (data?.isAdmin || !accessChanges) && 'activated',
                                                    loading.send && 'disabled',
                                                )}
                                            >
                                                <Text className={classNames(loading.send && 'disabled')}>
                                                    {SECTION_TITLES[permission.url]}
                                                </Text>
                                                <Checkbox
                                                    checked={allChecked}
                                                    indeterminate={indeterminate}
                                                    disabled={loading.send || !!data?.isAdmin || !accessChanges}
                                                    onChange={(event) => updateSectionPermissions(sectionKey, event.target.checked)}
                                                />
                                            </Tappable>
                                            <div
                                                className={classNames(
                                                    styles.section__permissions,
                                                    isOpened && styles['section__permissions--opened'],
                                                )}
                                            >
                                                <div className={styles.section__list}>
                                                    {Object.entries(permission.access).map(([accessKey, enabled]) => (
                                                        <Tappable
                                                            key={accessKey}
                                                            hasHoverWithChildren={true}
                                                            Component={'label'}
                                                            className={classNames(
                                                                styles.section__root,
                                                                (data?.isAdmin || !accessChanges) && 'activated',
                                                                loading.send && 'disabled',
                                                            )}
                                                        >
                                                            <Text className={classNames(loading.send && 'disabled')}>
                                                                {ACCESS_TITLES[accessKey as keyof typeof ACCESS_TITLES]}
                                                            </Text>
                                                            <Checkbox
                                                                checked={enabled}
                                                                disabled={loading.send || !!data?.isAdmin || !accessChanges}
                                                                onChange={(event) => updatePermission(sectionKey, accessKey, event.target.checked)}
                                                            />
                                                        </Tappable>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </>
                )}
            </div>
            {!(loading.get || data?.isAdmin || !accessChanges) && (
                <div className={styles.foot}>
                    <ButtonGroup
                        stretched={true}
                        align={'right'}
                    >
                        <Button
                            disabled={loading.send || !hasChanges}
                            size={'m'}
                            mode={'secondary'}
                            appearance={'negative'}
                            onClick={() => setData(savedData)}
                        >
                            Сбросить изменения
                        </Button>
                        <Button
                            disabled={loading.send || !hasChanges}
                            loading={loading.send}
                            size={'m'}
                            onClick={savePermissions}
                        >
                            Сохранить
                        </Button>
                    </ButtonGroup>
                </div>
            )}
        </div>
    );
};

export default DetailInfoRole;
