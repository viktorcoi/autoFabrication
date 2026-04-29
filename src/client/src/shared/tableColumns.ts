import {Column} from "@/components/Table/types";

export const tableColumns: Record<string, Column[]> = {
    showErrors: [
        {key: 'status', header: 'Статус', type: 'status', size: 95, minSize: 95, resize: false, dragging: false},
        {key: 'name', header: 'Название', size: 200, minSize: 200, resize: false, dragging: false},
        {key: 'description', header: 'Описание', size: 397, minSize: 397, resize: false, dragging: false},
    ],

    user: [
        {key: 'login', header: 'Логин', size: 180, minSize: 120,  isConst: true},
        {key: 'lastName', header: 'Фамилия', size: 200, minSize: 180},
        {key: 'firstName', header: 'Имя', size: 120, minSize: 100},
        {key: 'middleName', header: 'Отчество', size: 180, minSize: 180},
        {key: 'role', header: 'Роль', size: 120, minSize: 100, isConst: true},
        {key: 'avatar', header: 'Фото', size: 85, minSize: 85, type: 'avatar', isConst: true, resize: false},
        {key: 'birthDate', header: 'Дата рождения', size: 180, minSize: 180, type: 'date'},
    ],

    typeProducts: [
        {key: 'name', header: 'Название', minSize: 120},
        {key: 'description', header: 'Описание', minSize: 180},
    ],

    materialGroup: [
        {key: 'name', header: 'Название', minSize: 120},
        {key: 'description', header: 'Описание', minSize: 180},
    ]
}
