'use client'

import React, {ReactNode, useEffect, useMemo, useState} from "react";
import {ApiService} from "@/apiService/apiService";
import {GetRolesResponse} from "@/apiService/apiRoles/types";
import {
    ActionSheet,
    ActionSheetItem,
    Button,
    classNames,
    Counter,
    Placeholder,
    Search,
    SimpleCell,
    Spinner,
} from "@vkontakte/vkui";
import {
    Icon24Add, Icon24ListDeleteOutline,
    Icon24MoreVertical,
    Icon24PenOutline,
    Icon24TrashSimpleOutline,
    Icon28BriefcaseOutline,
} from "@vkontakte/icons";
import Container from "@/components/Container/Container";
import styles from './page.module.scss';
import {mergeState} from "@/shared/helpers";
import ModalManageRole from "@/components/modals/ModalManageRole/ModalManageRole";
import {ModalPageCloseReasonType, OpenModalsType} from "@/components/modals/types";
import ModalRemove from "@/components/modals/ModalRemove/ModalRemove";
import {useController, useSearch} from "@/shared/hooks";
import DetailInfoRole from "@/sections/roles/DetailInfoRole";
import {useAppStore} from "@/store/app/app";

const RolesPage = () => {

    const [roles, setRoles] = useState<GetRolesResponse[]>([]);
    const [actionSheet, setActionSheet] = useState<ReactNode>(null);
    const [selectedRole, setSelectedRole] = useState<number | null>(null);
    const [loading, setLoading] = useState({
        page: true,
        permissions: false
    });
    const [modals, setModals] = useState<OpenModalsType<
        'modal-manage-role' | 'modal-remove-role'
    >>({id: null, show: false, data: null});

    const {
        search,
        setSearch,
        delaySearch,
        inputRef
    } = useSearch(loading.page, 'roles');

    // TODO - (PERMISSIONS/ACCESS/ДОСТУП) dev режим защиты
    const { TEST, permissions } = useAppStore(s => s);
    const { createController } = useController([delaySearch]);

    const getRoles = async () => {
        mergeState({page: true}, setLoading);

        const controller = createController();

        await ApiService.roles.get({
            controller,
            options: { search: delaySearch || undefined }
        }).then(({status, data}) => {
            if (status === 'success') {
                setRoles(data);
                if (selectedRole !== null && !(data.some(({id}) => id === selectedRole))) {
                    setSelectedRole(null);
                }
            }
        })
    };

    useEffect(() => {
        getRoles().finally(() => mergeState({page: false}, setLoading));
    }, [delaySearch]);

    const closeModal = (r: ModalPageCloseReasonType) => {
        mergeState({show: false}, setModals);
        if (r === 'updated-data') {
            getRoles().finally(() => mergeState({page: false}, setLoading));
        }
    };

    const openMenu = (role: GetRolesResponse, target: HTMLElement) => {
        if (!access.editing && !access?.removing) return;

        setActionSheet(
            <ActionSheet
                placement={'bottom-end'}
                popupOffsetDistance={8}
                toggleRef={target}
                onClosed={() => setActionSheet(null)}
            >
                {access.editing && (
                    <ActionSheetItem
                        onClick={() => setModals({id: 'modal-manage-role', show: true, data: role.id})}
                        before={<Icon24PenOutline width={20} height={20}/>}
                    >
                        Редактировать
                    </ActionSheetItem>
                )}
                {access.removing && (
                    <ActionSheetItem
                        onClick={() => setModals({id: 'modal-remove-role', show: true, data: {id: role.id, name: role.name}})}
                        mode={'destructive'}
                        before={<Icon24TrashSimpleOutline width={20} height={20}/>}
                    >
                        Удалить
                    </ActionSheetItem>
                )}
            </ActionSheet>,
        );
    };

    // TODO - (PERMISSIONS/ACCESS/ДОСТУП) dev режим защиты
    const access = useMemo(() => ({
        adding: permissions.get('/roles')?.adding || !TEST,
        editing: permissions.get('/roles')?.editing || !TEST,
        removing: permissions.get('/roles')?.removing || !TEST,
    }), [permissions, TEST]);

    return (
        <>
            {'modal-remove-role' === modals.id ? (
                <ModalRemove
                    removeId={modals.data?.id}
                    mode={'list'}
                    name={modals.data?.name}
                    url={'/roles'}
                    onClose={closeModal}
                    onClosed={() => setModals({id: null, show: false, data: null})}
                    open={modals.show}
                />
            ) : 'modal-manage-role' === modals.id && (
                <ModalManageRole
                    idRole={modals.data}
                    open={modals.show}
                    onClose={closeModal}
                    onClosed={() => setModals({id: null,  show: false, data: null})}
                />
            )}
            <Container
                header={(
                    <>
                        {access.adding && (
                            <Button
                                size={'m'}
                                disabled={loading.page || loading.permissions}
                                before={<Icon24Add/>}
                                onClick={() => mergeState({id: 'modal-manage-role', show: true}, setModals)}
                            >
                                Добавить
                            </Button>
                        )}
                        <Search
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            disabled={loading.page || loading.permissions}
                            noPadding={true}
                            className={'search'}
                            slotProps={{ input: { getRootRef: inputRef } }}
                        />
                    </>
                )}
            >
                {actionSheet}
                <div className={styles.wrap}>
                    <div className={classNames('island scroll', styles.list)}>
                        {loading.page ? <Spinner size={'xl'}/> : !roles.length && !!delaySearch.trim() ? (
                            <Placeholder
                                noPadding={true}
                                icon={<Icon24ListDeleteOutline width={42} height={42} />}
                            >
                                Совпадений не найдено
                            </Placeholder>
                        ): roles.map(r => (
                            <SimpleCell
                                key={r.id}
                                className={classNames(
                                    selectedRole === r.id && 'activated',
                                    loading.permissions && 'disabled'
                                )}
                                activated={selectedRole === r.id}
                                hasHoverWithChildren={true}
                                onClick={() => setSelectedRole(r.id)}
                                after={
                                    <>
                                        {!!r._count.users && (
                                            <Counter size={'s'}>{r._count.users}</Counter>
                                        )}
                                        {(access.editing || access.removing) && (
                                            <Button
                                                after={<Icon24MoreVertical fill={'var(--vkui--color_icon_primary)'} width={24} height={24}/>}
                                                mode={'tertiary'}
                                                rounded={true}
                                                size={'m'}
                                                disabled={r.isAdmin}
                                                className={classNames(
                                                    styles.menu,
                                                    loading.permissions && 'disabled'
                                                )}
                                                label={'Меню'}
                                                onClick={e => {
                                                    e.stopPropagation();
                                                    openMenu(r, e.currentTarget);
                                                }}
                                            />
                                        )}
                                    </>
                                }
                            >
                                {r.name}
                            </SimpleCell>
                        ))}
                    </div>
                    <div
                        className={classNames('island', styles.detail)}
                    >
                        {selectedRole === null ? (
                            <Placeholder
                                stretched={true}
                                icon={<Icon28BriefcaseOutline width={130} height={130}/>}
                            >
                                Выберите роль для настройки
                            </Placeholder>
                        ) : (
                            <DetailInfoRole
                                id={selectedRole}
                                onLoading={v => mergeState({permissions: v}, setLoading)}
                            />
                        )}
                    </div>
                </div>
            </Container>
        </>
    )
};

export default RolesPage;
