import {Text} from "@vkontakte/vkui";
import {
    Icon20WrenchOutline,
    Icon24DrillOutline,
    Icon24EmployeeOutline,
    Icon24HammerOutline,
    Icon24TruckOutline,
    Icon56SettingsOutline
} from "@vkontakte/icons";
import styles from "./page.module.scss";

const LoadingPage = () => {

    return (
        <div className={styles.wrap}>
            <div>
                <div className={styles.loading}>
                    <Icon56SettingsOutline
                        className={styles.spinner}
                        width={120}
                        height={120}
                    />
                    <Icon56SettingsOutline
                        className={styles.spinner}
                        width={42}
                        height={42}
                    />
                    <Icon56SettingsOutline
                        className={styles.spinner}
                        width={30}
                        height={30}
                    />
                    <span className={styles.icons}>
                        <Icon24EmployeeOutline className={styles.icon}/>
                        <Icon24DrillOutline className={styles.icon}/>
                        <Icon24HammerOutline className={styles.icon}/>
                        <Icon20WrenchOutline width={24} height={24} className={styles.icon}/>
                        <Icon24TruckOutline className={styles.icon}/>
                    </span>
                </div>
                <Text
                    weight={'2'}
                    className={styles.status}
                >
                    Загрузка
                </Text>
            </div>
        </div>
    )
};

export default LoadingPage;
