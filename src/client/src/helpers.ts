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

export const mergeState = <K>(
    newState: Partial<K>,
    setState: Dispatch<SetStateAction<K>>
) => {
    setState(prevState => ({ ...prevState, ...newState }));
}
