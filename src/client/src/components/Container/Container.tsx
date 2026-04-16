import {ContainerProps} from "@/components/Container/types";
import styles from './Container.module.scss';
import Navigation from "@/components/Navigation/Navigation";
import {classNames} from "@vkontakte/vkui";

const Container = (props: ContainerProps) => {

    const {
        header,
        children
    } = props;

    return (
        <div
            className={styles.wrap}
        >
            <Navigation/>
            <div className={styles.content}>
                {header && (
                    <div
                        className={classNames(
                            'island',
                            styles.header
                        )}
                    >
                        {header}
                    </div>
                )}
                {children}
            </div>
        </div>
    )
};

export default Container;
