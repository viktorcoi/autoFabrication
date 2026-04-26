export const compareValues = (left: unknown, right: unknown) => {
    if (typeof left === 'number' && typeof right === 'number') {
        return left - right;
    }

    if (typeof left === 'boolean' && typeof right === 'boolean') {
        return Number(left) - Number(right);
    }

    return String(left ?? '').localeCompare(String(right ?? ''), 'ru', {
        numeric: true,
        sensitivity: 'base',
    });
};
