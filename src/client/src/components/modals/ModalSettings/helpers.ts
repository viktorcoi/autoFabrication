export type FieldType = {
    value: string;
    isValid: boolean;
    textError?: string;
};

export const initField: FieldType = {
    value: '',
    isValid: false,
};

export const isValidPassword = (value: string): FieldType => {
    let newField: FieldType = { value: value, isValid: true};

    if (value.length < 6) {
        newField.isValid = false;
        newField.textError = 'Пароль должен содержать не менее 6 символов.'
    }

    return newField;
};

export const isValidConfirmPassword = (value: string, password: string): FieldType => {
    let newField = isValidPassword(value);

    if (value.trim() !== password.trim()) {
        newField.isValid = false;
        newField.textError = 'Пароли не совпадают';
    }

    return newField;
};

