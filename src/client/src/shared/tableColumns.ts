import {Column} from "@/components/Table/types";

export const tableColumns: Record<string, Column[]> = {
    showErrors: [
        {key: 'status', header: 'Статус', type: 'status', size: 95, resize: false, dragging: false},
        {key: 'name', header: 'Название', size: 200, resize: false, dragging: false},
        {key: 'description', header: 'Описание', size: 397, resize: false, dragging: false},
    ],

    user: [
        {key: 'login', header: 'Логин', minSize: 90, size: 180, maxSize: 430, isConst: true},
        {key: 'lastName', header: 'Фамилия', minSize: 110, size: 240, maxSize: 265},
        {key: 'firstName', header: 'Имя', minSize: 75, size: 140, maxSize: 265},
        {key: 'middleName', header: 'Отчество', minSize: 110, size: 180, maxSize: 265},
        {key: 'role', header: 'Роль', minSize: 85, size: 180, maxSize: 625, isConst: true},
        {key: 'avatar', header: 'Фото', size: 85, type: 'avatar', isConst: true, resize: false},
        {key: 'birthDate', header: 'Дата рождения', size: 180, resize: false, type: 'date'},
    ],

    typeProducts: [
        {key: 'name', header: 'Название', minSize: 110, size: 250, maxSize: 625},
        {key: 'description', header: 'Описание', minSize: 115, size: 800, maxSize: 3065},
    ],

    material: [
        {key: 'name', header: 'Название', minSize: 110, size: 250, maxSize: 625},
        {key: 'materialGroup', header: 'Группа материалов', minSize: 175, size: 200, maxSize: 625},
        {key: 'description', header: 'Описание', minSize: 115, size: 700, maxSize: 3065},
    ],

    blank: [
        {key: 'name', header: 'Название', minSize: 110, size: 250, maxSize: 625},
        {key: 'material', header: 'Материал', minSize: 140, size: 220, maxSize: 625},
        {key: 'materialGroup', header: 'Группа материалов', minSize: 175, size: 220, maxSize: 625},
        {key: 'description', header: 'Описание', minSize: 115, size: 500, maxSize: 3065},
    ],

    workGroup: [
        {key: 'name', header: 'Название', minSize: 110, size: 250, maxSize: 625},
        {key: 'operation', header: 'Операция', minSize: 145, size: 220, maxSize: 625},
        {key: 'operationGroup', header: 'Группа операций', minSize: 175, size: 220, maxSize: 625},
        {key: 'description', header: 'Описание', minSize: 115, size: 500, maxSize: 3065},
    ],

    materialGroup: [
        {key: 'name', header: 'Название', minSize: 110, size: 250, maxSize: 625},
        {key: 'description', header: 'Описание', minSize: 115, size: 800, maxSize: 3065},
    ],

    operationGroup: [
        {key: 'name', header: 'Название', minSize: 110, size: 250, maxSize: 625},
        {key: 'description', header: 'Описание', minSize: 115, size: 800, maxSize: 3065},
    ],

    operation: [
        {key: 'name', header: 'Название', minSize: 110, size: 250, maxSize: 625},
        {key: 'operationGroup', header: 'Группа операций', minSize: 160, size: 200, maxSize: 625},
        {key: 'download', header: 'Файлы', type: 'download', size: 95, resize: false},
        {key: 'description', header: 'Описание', minSize: 115, size: 600, maxSize: 3065},
    ],

    work: [
        {key: 'name', header: 'Название', minSize: 110, size: 220, maxSize: 625},
        {key: 'tpz', header: 'Тпз', minSize: 90, size: 110, maxSize: 140, type: 'decimal'},
        {key: 'tsht', header: 'Тшт', minSize: 90, size: 110, maxSize: 140, type: 'decimal'},
        {key: 'workGroup', header: 'Группа работ', minSize: 150, size: 200, maxSize: 625},
        {key: 'operation', header: 'Операция', minSize: 145, size: 200, maxSize: 625},
        {key: 'operationGroup', header: 'Группа операций', minSize: 175, size: 220, maxSize: 625},
        {key: 'download', header: 'Файлы', type: 'download', size: 95, resize: false},
        {key: 'description', header: 'Описание', minSize: 115, size: 420, maxSize: 3065},
    ],

    products: [
        {key: 'id', header: 'ID', size: 100, resize: false},
        {key: 'name', header: 'Название изделия', minSize: 170, size: 220, maxSize: 625},
        {key: 'typeProduct', header: 'Тип изделия', minSize: 130, size: 220, maxSize: 625},
        {key: 'material', header: 'Материал', minSize: 115, size: 220, maxSize: 625},
        {key: 'creator', header: 'Создал', minSize: 100, size: 220, maxSize: 750},
        {key: 'filesDownload', header: 'Файлы', type: 'download', size: 95, resize: false},
        {key: 'relatedProductsCount', header: 'Связанные', size: 125, resize: false, type: 'text'},
        {key: 'createdAt', header: 'Дата создания', size: 180, resize: false, type: 'date'},
        {key: 'description', header: 'Описание', minSize: 115, size: 420, maxSize: 3065},
    ],

    process: [
        {key: 'id', header: 'ID', size: 100, resize: false},
        {key: 'name', header: 'Наименование тех. процесса', minSize: 170, size: 220, maxSize: 625},
        {key: 'creator', header: 'Разработал', minSize: 100, size: 220, maxSize: 750},
        {key: 'updatedAt', header: 'Дата изменения', size: 180, resize: false, type: 'date'},
        {key: 'material', header: 'Материал', minSize: 115, size: 220, maxSize: 625},
        {key: 'blank', header: 'Загатовка', minSize: 115, size: 220, maxSize: 625},
        {key: 'operationCount', header: 'Кол-во операций', size: 125, resize: false, type: 'text'},
        {key: 'access', header: 'Доступ', type: 'access', size: 95, resize: false}, // надо будет в таблицу добавить новый эл-нт, из бэка это должно приходить boolean, в таблице рендерится кнопка с замчком (закрытым или открытым)
        {key: 'description', header: 'Описание', minSize: 115, size: 420, maxSize: 3065},
    ]
};
