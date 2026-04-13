import {PropsWithChildren, ReactNode, useEffect, useMemo, useRef, useState} from "react";
import {
    Icon16Cancel,
    Icon16CancelCircle, Icon16CancelCircleOutline,
    Icon16DoneCircle,
    Icon16InfoCircle,
    Icon16WarningTriangle
} from "@vkontakte/icons";
import {Snackbar} from "@vkontakte/vkui";
import {SnackbarType, useSnackbarStore} from "@/store/snackbar/snackbar";
import styles from './SnackbarProvider.module.scss';

const renderIconByType: Record<SnackbarType, ReactNode> = {
    success: <Icon16DoneCircle width={20} height={20} fill={'var(--vkui--color_icon_positive)'} />,
    error: <Icon16CancelCircle width={20} height={20} fill={'var(--vkui--color_icon_negative)'} />,
    warning: <Icon16WarningTriangle width={20} height={20} fill={'var(--vkui--color_icon_warning)'} />,
    info: <Icon16InfoCircle width={20} height={20} fill={'var(--vkui--color_icon_accent)'} />,
};

const SnackbarProvider = (props: PropsWithChildren) => {

    const { children } = props;

    const snackbars = useSnackbarStore((state) => state.snackbars);
    const removeSnackbar = useSnackbarStore((state) => state.removeSnackbar);

    const [heights, setHeights] = useState<Record<number, number>>({});
    const [hovered, setHovered] = useState<null | number>(null);

    const refs = useRef<Record<number, HTMLDivElement | null>>({});

    useEffect(() => {
        const nextHeights: Record<number, number> = {};

        snackbars.slice(0, 3).forEach((s) => {
            nextHeights[s.id] = refs.current[s.id]?.offsetHeight ?? 0;
        });

        setHeights(nextHeights);
    }, [snackbars]);

    const visibleSnackbars = useMemo(() => {
        if (snackbars.length === 0) return null;

        return snackbars.slice(0, 3).map((s, index, arr) => {
            let offsetY = 0;

            for (let i = 0; i < index; i++) {
                offsetY += (heights[arr[i].id] ?? 0);
            }

            return (
                <Snackbar
                    key={s.id}
                    getRootRef={(el) => {
                        refs.current[s.id] = el;
                    }}
                    duration={s.id === hovered ? null : 5000}
                    onMouseLeave={() => setHovered(null)}
                    onMouseMove={() => {
                        if (hovered !== s.id) setHovered(s.id);
                    }}
                    onActionClick={s.onActionClick}
                    offsetY={offsetY}
                    placement="top-end"
                    action={s.action}
                    before={renderIconByType[s.type]}
                    onClosed={() => {
                        if (hovered === s.id) setHovered(null);
                        removeSnackbar(s.id)
                    }}
                >
                    <Icon16Cancel
                        onClick={() => removeSnackbar(s.id)}
                        className={styles.close}
                        width={14}
                        height={14}
                    />
                    {s.text}
                </Snackbar>
            );
        });
    }, [snackbars, hovered, heights]);

    return (
        <>
            {children}
            {visibleSnackbars}
        </>
    )
}

export default SnackbarProvider;
