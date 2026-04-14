import {ContainerProps} from "@/components/Container/types";
import styles from './Container.module.scss';

const Container = (props: ContainerProps) => {

    const {
        header,
        children
    } = props;

    return (
        <div className={styles.wrap}>
            {header && (
                <div className={styles.header}>{header}</div>
            )}
            {children}
        </div>
    )
};

export default Container;
