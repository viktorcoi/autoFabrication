'use client'

import React, {ReactNode, useEffect, useRef, useState} from "react";
import {ApiService} from "@/apiService/apiService";
import {GetRolesResponse} from "@/apiService/apiRoles/types";
import {
    ActionSheet,
    ActionSheetItem,
    Button,
    classNames,
    Counter,
    IconButton,
    Placeholder,
    Search,
    SimpleCell,
    Spinner,
} from "@vkontakte/vkui";
import {
    Icon24Add,
    Icon24MoreVertical,
    Icon24PenOutline,
    Icon24TrashSimpleOutline,
    Icon28BriefcaseOutline,
} from "@vkontakte/icons";
import Container from "@/components/Container/Container";
import styles from './page.module.scss';
import {mergeState} from "@/helpers";
import ModalManageRole from "@/components/modals/ModalManageRole/ModalManageRole";
import {ModalPageCloseReasonType, OpenModalsType} from "@/components/modals/types";
import ModalRemove from "@/components/modals/ModalRemove/ModalRemove";
import {useSearch} from "@/hooks";

const RolesPage = () => {

    const {search, setSearch, delaySearch} = useSearch();

    const [roles, setRoles] = useState<GetRolesResponse[]>([]);
    const [actionSheet, setActionSheet] = useState<ReactNode>(null);
    const [selectedRole, setSelectedRole] = useState<number | null>(null);
    const [loading, setLoading] = useState({
        page: true,
        modal: false
    });
    const [modals, setModals] = useState<OpenModalsType<
        'modal-manage-role' | 'modal-remove-role'
    >>({id: null, show: false, data: null});

    const controllerRef = useRef<AbortController>(null);

    const getRoles = async () => {
        mergeState({page: true}, setLoading);

        const controller = new AbortController();
        controllerRef.current = controller;

        await ApiService.roles.get({
            controller,
            options: { search: delaySearch || undefined }
        }).then(({status, data}) => {
            if (status === 'success') {
                setRoles(data);
            }
        })
    };

    useEffect(() => {
        getRoles().finally(() => mergeState({page: false}, setLoading));

        return () => {
            if (controllerRef.current) controllerRef.current.abort();
        }
    }, [delaySearch]);

    const openMenu = (role: GetRolesResponse, target: HTMLElement) => {
        setActionSheet(
            <ActionSheet
                placement={'bottom-end'}
                popupOffsetDistance={8}
                toggleRef={target}
                onClosed={() => setActionSheet(null)}
            >
                <ActionSheetItem
                    onClick={() => setModals({id: 'modal-manage-role', show: true, data: role.id})}
                    before={<Icon24PenOutline width={20} height={20}/>}
                >
                    Редактировать
                </ActionSheetItem>
                <ActionSheetItem
                    onClick={() => setModals({id: 'modal-remove-role', show: true, data: {id: role.id, name: role.name}})}
                    mode={'destructive'}
                    before={<Icon24TrashSimpleOutline width={20} height={20}/>}
                >
                    Удалить
                </ActionSheetItem>
            </ActionSheet>,
        );
    };

    const closeModal = (r: ModalPageCloseReasonType) => {
        mergeState({show: false}, setModals);
        if (r === 'updated-data') {
            getRoles().finally(() => mergeState({page: false}, setLoading));
        }
    };

    return (
        <>
            {'modal-remove-role' === modals.id ? (
                <ModalRemove
                    removeId={modals.data?.id}
                    name={modals.data?.name}
                    url={'/roles'}
                    onLoading={v => mergeState({modal: v}, setLoading)}
                    onClose={closeModal}
                    onClosed={() => setModals({id: null, show: false, data: null})}
                    open={modals.show}
                    preventClose={loading.modal}
                />
            ) : 'modal-manage-role' === modals.id && (
                <ModalManageRole
                    idRole={modals.data}
                    preventClose={loading.modal}
                    onLoading={v => mergeState({modal: v}, setLoading)}
                    open={modals.show}
                    onClose={closeModal}
                    onClosed={() => setModals({id: null,  show: false, data: null})}
                />
            )}
            <Container
                header={(
                    <>
                        <Button
                            size={'m'}
                            disabled={loading.page}
                            before={<Icon24Add/>}
                            onClick={() => mergeState({id: 'modal-manage-role', show: true}, setModals)}
                        >
                            Добавить
                        </Button>
                        <Search
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            disabled={loading.page}
                            noPadding={true}
                            className={'search'}
                        />
                    </>
                )}
            >
                {actionSheet}
                <div className={styles.wrap}>
                    <div className={classNames('island scroll', styles.list)}>
                        {loading.page ? <Spinner size={'xl'}/> : roles.map(r => (
                            <SimpleCell
                                key={r.id}
                                className={classNames(selectedRole === r.id && 'activated')}
                                activated={selectedRole === r.id}
                                hasHoverWithChildren={true}
                                onClick={() => setSelectedRole(r.id)}
                                after={
                                    <>
                                        {!!r._count.users && (
                                            <Counter size={'s'}>{r._count.users}</Counter>
                                        )}
                                        <IconButton
                                            disabled={r.id === 1}
                                            className={styles.menu}
                                            label={'Меню'}
                                            onClick={e => {
                                                e.stopPropagation();
                                                openMenu(r, e.currentTarget);
                                            }}
                                        >
                                            <Icon24MoreVertical fill={'var(--vkui--color_icon_primary)'} width={24} height={24}/>
                                        </IconButton>
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
                            <>

                                `Выбрана роль с id ${selectedRole}`
                            </>
                        )}
                    </div>
                </div>
            </Container>
        </>
    )
};

export default RolesPage;
