import {Column} from "@/components/Table/types";

export const tableColumns: Record<string, Column[]> = {
    showErrors: [
        {key: 'status', header: 'Статус', type: 'status', size: 95, resize: false, dragging: false},
        {key: 'name', header: 'Название', size: 200, resize: false, dragging: false},
        {key: 'description', header: 'Описание', size: 397, resize: false, dragging: false},
    ],

    user: [
        {key: 'login', header: 'Логин', minSize: 90, size: 180, maxSize: 430,  isConst: true},
        {key: 'lastName', header: 'Фамилия', minSize: 110, size: 240, maxSize: 265},
        {key: 'firstName', header: 'Имя', minSize: 75, size: 140, maxSize: 265},
        {key: 'middleName', header: 'Отчество', minSize: 110, size: 180, maxSize: 265},
        {key: 'role', header: 'Роль', minSize: 85, size: 180, maxSize: 385, isConst: true},
        {key: 'avatar', header: 'Фото', size: 85, type: 'avatar', isConst: true, resize: false},
        {key: 'birthDate', header: 'Дата рождения', size: 180, resize: false, type: 'date'},
    ],

    typeProducts: [
        {key: 'name', header: 'Название', minSize: 110, size: 250, maxSize: 385},
        {key: 'description', header: 'Описание', minSize: 115, size: 800, maxSize: 3065},
    ],

    material: [
        {key: 'name', header: 'Название', minSize: 110, size: 250, maxSize: 385},
        {key: 'materialGroup', header: 'Группа материалов', minSize: 175, size: 200, maxSize: 385},
        {key: 'description', header: 'Описание', minSize: 115, size: 700, maxSize: 3065},
    ],

    blank: [
        {key: 'name', header: 'Название', minSize: 110, size: 250, maxSize: 385},
        {key: 'material', header: 'Материал', minSize: 140, size: 220, maxSize: 385},
        {key: 'materialGroup', header: 'Группа материалов', minSize: 175, size: 220, maxSize: 385},
        {key: 'description', header: 'Описание', minSize: 115, size: 500, maxSize: 3065},
    ],

    materialGroup: [
        {key: 'name', header: 'Название', minSize: 110, size: 250, maxSize: 385},
        {key: 'description', header: 'Описание', minSize: 115, size: 800, maxSize: 3065},
    ],

    operationGroup: [
        {key: 'name', header: 'Название', minSize: 110, size: 250, maxSize: 385},
        {key: 'description', header: 'Описание', minSize: 115, size: 800, maxSize: 3065},
    ],

    operation: [
        {key: 'name', header: 'Название', minSize: 110, size: 250, maxSize: 385},
        {key: 'operationGroup', header: 'Группа операций', minSize: 160, size: 200, maxSize: 385},
        {key: 'download', header: 'Файлы', type: 'download', size: 95, resize: false},
        {key: 'description', header: 'Описание', minSize: 115, size: 600, maxSize: 3065},
    ]
}
