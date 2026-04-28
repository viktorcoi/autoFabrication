import {
    Icon20BookSpreadSimpleOutline,
    Icon20UsersOutline,
    Icon20WrenchOutline,
    Icon24BriefcaseOutline
} from "@vkontakte/icons";
import {Navigate} from "@/store/app/types";

export const allUrl: Navigate[] = [
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
        name: 'Справочники',
        url: '/guide',
        icon: <Icon20BookSpreadSimpleOutline fill={'var(--vkui--color_text_primary)'} width={20} height={20}/>,
    },
    {
        name: 'Изделия',
        url: '/products',
        icon: <Icon20WrenchOutline fill={'var(--vkui--color_text_primary)'} width={20} height={20}/>,
    }
];
