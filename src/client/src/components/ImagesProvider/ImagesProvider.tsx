import 'react-photo-view/dist/react-photo-view.css';
import './ImagesProvider.module.scss';
import {PhotoProviderProps} from "react-photo-view/dist/PhotoProvider";
import {PhotoProvider} from "react-photo-view";
import {Button, classNames, Text} from "@vkontakte/vkui";
import {
    Icon24Cancel,
    Icon24ChevronLeft, Icon24ChevronRight
} from "@vkontakte/icons";
import styles from "./ImagesProvider.module.scss";

const ImagesProvider = (props: PhotoProviderProps) => {

    const {
        children,
        speed = () => 300,
        loop = true,
        ...restProps
    } = props;

    return (
        <PhotoProvider
            loop={loop}
            speed={speed}
            {...restProps}
            bannerVisible={false}
            maskClassName={styles.mask}
            overlayRender={({overlayVisible, images, index, onClose, onIndexChange}) => {
                return (
                    <div className={styles.overlay}>
                        <div
                            className={classNames(
                                styles.banner,
                                overlayVisible && styles['banner--show']
                            )}
                        >
                            <Text>
                                {images.length > 1 ? `${index + 1}/${images.length}` : ''}
                            </Text>
                            <Button
                                size={'l'}
                                rounded={true}
                                after={<Icon24Cancel width={24} height={24}/>}
                                mode={'secondary'}
                                onClick={onClose}
                            />
                        </div>
                        {images.length > 1 && (
                            <>
                                <Button
                                    className={classNames(
                                        styles.button,
                                        styles['button--right']
                                    )}
                                    size={'l'}
                                    rounded={true}
                                    after={<Icon24ChevronRight width={24} height={24}/>}
                                    mode={'secondary'}
                                    onClick={() => onIndexChange(index + 1)}
                                />
                                <Button
                                    className={classNames(
                                        styles.button,
                                        styles['button--left']
                                    )}
                                    size={'l'}
                                    rounded={true}
                                    after={<Icon24ChevronLeft width={24} height={24}/>}
                                    mode={'secondary'}
                                    onClick={() => onIndexChange(index - 1)}
                                />
                            </>
                        )}
                    </div>
                )
            }}
        >
            {children}
        </PhotoProvider>
    )
}

export default ImagesProvider;
