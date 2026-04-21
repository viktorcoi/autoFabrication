export const tableColumns = {
    user: [
        {key: 'login', header: 'Логин', size: 240, minSize: 180, maxSize: 380, isConst: true},
        {key: 'lastName', header: 'Фамилия', size: 90, minSize: 80, maxSize: 200},
        {key: 'firstName', header: 'Имя', size: 170},
        {key: 'middleName', header: 'Отчество', size: 170},
        {key: 'role', header: 'Роль', size: 170, isConst: true},
        {key: 'avatar', header: 'Фото', size: 90, minSize: 80, maxSize: 140, type: 'avatar', isConst: true},
        {key: 'birthDate', header: 'Дата рождения', size: 180, minSize: 180, maxSize: 300, type: 'date'},
    ]
}
