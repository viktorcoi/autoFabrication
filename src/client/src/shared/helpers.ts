import {Dispatch, SetStateAction} from "react";

export const hasPathPermission = (
    permissions: Record<string, unknown>,
    path: string,
) => {
    const permissionEntry = Object.values(permissions).find((value) => {
        return (
            value &&
            typeof value === "object" &&
            "url" in value &&
            value.url === path
        );
    });

    if (!permissionEntry || typeof permissionEntry !== "object" || !("access" in permissionEntry)) {
        return false;
    }

    const access = permissionEntry.access;

    if (!access || typeof access !== "object") {
        return false;
    }

    return Object.values(access).some((value) => value === true);
};

export const hasPathActionPermission = (
    permissions: Record<string, unknown>,
    path: string,
    action: string,
) => {
    const permissionEntry = Object.values(permissions).find((value) => {
        return (
            value &&
            typeof value === "object" &&
            "url" in value &&
            value.url === path
        );
    });

    if (!permissionEntry || typeof permissionEntry !== "object" || !("access" in permissionEntry)) {
        return false;
    }

    const access = permissionEntry.access;

    if (!access || typeof access !== "object" || !(action in access)) {
        return false;
    }

    return (access as Record<string, unknown>)[action] === true;
};

export const mergeState = <K>(
    newState: Partial<K>,
    setState: Dispatch<SetStateAction<K>>
) => {
    setState(prevState => ({ ...prevState, ...newState }));
};

const getRandomNumber = (max: number) => {
    if (max <= 0) {
        return 0;
    }

    if (typeof globalThis.crypto !== 'undefined' && typeof globalThis.crypto.getRandomValues === 'function') {
        const values = new Uint32Array(1);
        globalThis.crypto.getRandomValues(values);

        return values[0] % max;
    }

    return Math.floor(Math.random() * max);
};

const PASSWORD_LENGTH = 8;
const PASSWORD_LOWERCASE = 'abcdefghijkmnopqrstuvwxyz';
const PASSWORD_UPPERCASE = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
const PASSWORD_DIGITS = '23456789';
const PASSWORD_SYMBOLS = '!@#$%^&*';

const getRandomCharacter = (characters: string) => {
    return characters[getRandomNumber(characters.length)] ?? '';
};

const shuffle = <Value,>(values: Value[]) => {
    const nextValues = [...values];

    for (let index = nextValues.length - 1; index > 0; index -= 1) {
        const randomIndex = getRandomNumber(index + 1);
        const currentValue = nextValues[index];

        nextValues[index] = nextValues[randomIndex];
        nextValues[randomIndex] = currentValue;
    }

    return nextValues;
};

export const autogeneratePassword = () => {
    const requiredCharacters = [
        getRandomCharacter(PASSWORD_LOWERCASE),
        getRandomCharacter(PASSWORD_UPPERCASE),
        getRandomCharacter(PASSWORD_DIGITS),
        getRandomCharacter(PASSWORD_SYMBOLS),
    ];
    const allCharacters = `${PASSWORD_LOWERCASE}${PASSWORD_UPPERCASE}${PASSWORD_DIGITS}${PASSWORD_SYMBOLS}`;

    while (requiredCharacters.length < PASSWORD_LENGTH) {
        requiredCharacters.push(getRandomCharacter(allCharacters));
    }

    return shuffle(requiredCharacters).join('');
};
