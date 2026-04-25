export const tableColumns = {
    user: [
        {key: 'login', header: 'Логин', size: 180, minSize: 180, maxSize: 400, isConst: true},
        {key: 'lastName', header: 'Фамилия', size: 200, minSize: 180, maxSize: 400},
        {key: 'firstName', header: 'Имя', size: 120, minSize: 100, maxSize: 400},
        {key: 'middleName', header: 'Отчество', size: 180, minSize: 180, maxSize: 400},
        {key: 'role', header: 'Роль', size: 120, minSize: 100, maxSize: 400, isConst: true},
        {key: 'avatar', header: 'Фото', size: 85, minSize: 85, maxSize: 85, type: 'avatar', isConst: true},
        {key: 'birthDate', header: 'Дата рождения', size: 150, minSize: 150, maxSize: 150, type: 'date'},
    ]
}
