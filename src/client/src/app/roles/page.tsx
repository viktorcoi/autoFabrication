'use client'

import {ReactNode, useEffect, useRef, useState} from "react";
import {ApiService} from "@/apiService/apiService";
import {GetRolesResponse} from "@/apiService/apiRoles/types";
import {
    ActionSheet,
    ActionSheetItem,
    Button,
    classNames, Counter, FormStatus,
    IconButton,
    Placeholder,
    Search,
    SimpleCell, Spinner
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

const RolesPage = () => {

    const [roles, setRoles] = useState<GetRolesResponse[]>([]);
    const [actionSheet, setActionSheet] = useState<ReactNode>(null);
    const [selectedRole, setSelectedRole] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);
    const menuRef = useRef(null);

    useEffect(() => {
        setLoading(true);

        ApiService.roles.get({}).then(({status, data}) => {
            if (status === 'success') {
                data.push({
                    id: 2,
                    name: 'Александр',
                    description: '',
                    permissions: {},
                    createdAt: '',
                    updatedAt: '',
                    _count: {
                        users: 345
                    }
                })
                setRoles(data);
            }
        }).finally(() => setLoading(false));
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
        <Container
            header={(
                <>
                    <Button
                        disabled={loading}
                        before={<Icon24Add/>}
                        size={'m'}
                    >
                        Добавить
                    </Button>
                    <Search
                        disabled={loading}
                        noPadding={true}
                        className={'search'}
                    />
                </>
            )}
        >
            {actionSheet}
            <div className={styles.wrap}>
                <div className={styles.list}>
                    {loading ? <Spinner size={'xl'}/> : roles.map(r => (
                        <SimpleCell
                            key={r.id}
                            className={classNames(selectedRole === r.id && 'activated')}
                            activated={selectedRole === r.id}
                            hasHoverWithChildren={true}
                            onClick={() => setSelectedRole(r.id)}
                            after={
                                <>
                                    <Counter size={'s'}>{r._count.users}</Counter>
                                    {r.id !== 1 && (
                                        <IconButton
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
                                    )}
                                </>
                            }
                        >
                            {r.name}
                        </SimpleCell>
                    ))}
                </div>
                <div
                    className={styles.detail}
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
                            <FormStatus>{roles.find(({id}) => id === selectedRole)?.description}</FormStatus>
                            `Выбрана роль с id ${selectedRole}`
                        </>
                    )}
                </div>
            </div>
        </Container>
    )
};

export default RolesPage;
