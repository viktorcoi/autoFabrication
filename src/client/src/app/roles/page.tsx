'use client'

import {ReactNode, useEffect, useRef, useState} from "react";
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
import {OpenModalsType} from "@/components/modals/types";

const RolesPage = () => {

    const [roles, setRoles] = useState<GetRolesResponse[]>([]);
    const [actionSheet, setActionSheet] = useState<ReactNode>(null);
    const [selectedRole, setSelectedRole] = useState<number | null>(null);
    const [loading, setLoading] = useState({
        page: true,
        modal: false
    });
    const [modals, setModals] = useState<OpenModalsType>({id: null, data: null});

    const controllerRef = useRef<AbortController>(null);
    const menuRef = useRef(null);

    const getRoles = async () => {
        mergeState({page: true}, setLoading);

        const controller = new AbortController();
        controllerRef.current = controller;

        await ApiService.roles.get({
            controller
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
    }, []);

    const openMenu = () => {
        setActionSheet(
            <ActionSheet
                placement={'bottom-end'}
                popupOffsetDistance={8}
                toggleRef={menuRef}
                onClosed={() => setActionSheet(null)}
            >
                <ActionSheetItem
                    before={<Icon24PenOutline width={20} height={20}/>}
                >
                    Редактировать
                </ActionSheetItem>
                <ActionSheetItem
                    mode={'destructive'}
                    before={<Icon24TrashSimpleOutline width={20} height={20}/>}
                >
                    Удалить
                </ActionSheetItem>
            </ActionSheet>,
        );
    }

    return (
        <>
            <ModalManageRole
                idRole={modals.data}
                preventClose={loading.modal}
                onLoading={v => mergeState({modal: v}, setLoading)}
                open={'modal-manage-role' === modals.id}
                onClose={r => {
                    mergeState({id: null}, setModals);
                    if (r === 'updated-data') {
                        getRoles().finally(() => mergeState({page: false}, setLoading));
                    }
                }}
                onClosed={() => setModals({id: null, data: null})}
            />
            <Container
                header={(
                    <>
                        <Button
                            size={'m'}
                            disabled={loading.page}
                            before={<Icon24Add/>}
                            onClick={() => mergeState({id: 'modal-manage-role'}, setModals)}
                        >
                            Добавить
                        </Button>
                        <Search
                            disabled={loading.page}
                            noPadding={true}
                            className={'search'}
                        />
                    </>
                )}
            >
                {actionSheet}
                <div className={styles.wrap}>
                    <div className={classNames('island', styles.list)}>
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
                                            getRootRef={menuRef}
                                            label={'Меню'}
                                            onClick={e => {
                                                e.stopPropagation();
                                                openMenu();
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
