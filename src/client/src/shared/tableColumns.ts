import {Column} from "@/components/Table/types";

export const tableColumns: Record<string, Column[]> = {
    user: [
        {key: 'login', header: 'Логин', size: 180, minSize: 180, maxSize: 400, isConst: true},
        {key: 'lastName', header: 'Фамилия', size: 200, minSize: 180, maxSize: 400},
        {key: 'firstName', header: 'Имя', size: 120, minSize: 100, maxSize: 400},
        {key: 'middleName', header: 'Отчество', size: 180, minSize: 180, maxSize: 400},
        {key: 'role', header: 'Роль', size: 120, minSize: 100, maxSize: 400, isConst: true},
        {key: 'avatar', header: 'Фото', size: 85, minSize: 85, maxSize: 85, type: 'avatar', isConst: true, resize: false},
        {key: 'birthDate', header: 'Дата рождения', size: 180, minSize: 180, maxSize: 180, type: 'date'},
    ],

    showErrors: [
        {key: 'status', header: 'Статус', type: 'status', size: 95, minSize: 95, maxSize: 95, resize: false, dragging: false},
        {key: 'name', header: 'Название', size: 200, minSize: 200, maxSize: 200, resize: false, dragging: false},
        {key: 'description', header: 'Описание', size: 397, minSize: 397, maxSize: 397, resize: false, dragging: false},
    ]
}
