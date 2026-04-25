import {PostUserOptions} from "@/apiService/apiUsers/types";
import moment from "moment";

const CYRILLIC_TO_LATIN_MAP: Record<string, string> = {
    'а': 'a',
    'б': 'b',
    'в': 'v',
    'г': 'g',
    'д': 'd',
    'е': 'e',
    'ё': 'yo',
    'ж': 'zh',
    'з': 'z',
    'и': 'i',
    'й': 'y',
    'к': 'k',
    'л': 'l',
    'м': 'm',
    'н': 'n',
    'о': 'o',
    'п': 'p',
    'р': 'r',
    'с': 's',
    'т': 't',
    'у': 'u',
    'ф': 'f',
    'х': 'kh',
    'ц': 'ts',
    'ч': 'ch',
    'ш': 'sh',
    'щ': 'sch',
    'ъ': '',
    'ы': 'y',
    'ь': '',
    'э': 'e',
    'ю': 'yu',
    'я': 'ya',
};

const transliterateToLatin = (value: string) => {
    return Array.from(value.trim())
        .map((character) => {
            const lowerCharacter = character.toLowerCase();
            const transliteratedCharacter = CYRILLIC_TO_LATIN_MAP[lowerCharacter];

            if (transliteratedCharacter !== undefined) {
                return transliteratedCharacter;
            }

            return lowerCharacter;
        })
        .join('');
};

const normalizeLoginSegment = (value: string) => {
    return transliterateToLatin(value)
        .replace(/[^a-z0-9]/g, '')
        .toLowerCase();
};

const capitalize = (value: string) => {
    if (!value) {
        return '';
    }

    return `${value[0].toUpperCase()}${value.slice(1)}`;
};

const getInitialSegment = (value: string) => {
    const firstCharacter = value.trim().charAt(0);

    if (!firstCharacter) {
        return '';
    }

    return capitalize(
        transliterateToLatin(firstCharacter).replace(/[^a-z0-9]/g, ''),
    );
};

const getBirthYear = (birthDate: PostUserOptions['birthDate']) => {
    if (!birthDate) {
        return '';
    }

    const parsedDate = moment(birthDate);

    return parsedDate.isValid() ? String(parsedDate.year()) : '';
};

export const autogenerateLogin = (
    {
        firstName,
        lastName,
        middleName,
        birthDate,
    }: PostUserOptions,
) => {
    const loginBase = `${normalizeLoginSegment(lastName)}${getInitialSegment(firstName)}${getInitialSegment(middleName ?? '')}`;
    const birthYear = getBirthYear(birthDate);

    return birthYear ? `${loginBase}_${birthYear}` : loginBase;
};
