import {PropsWithChildren, ReactNode} from "react";

export interface ContainerProps extends PropsWithChildren {
    header?: ReactNode;
}
