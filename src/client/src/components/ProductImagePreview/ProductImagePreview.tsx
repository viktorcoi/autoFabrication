import {useEffect, useState} from "react";
import {PhotoView} from "react-photo-view";
import {ProductImagePreviewProps} from "@/components/ProductImagePreview/types";
import styles from './ProductImagePreview.module.scss';

const ProductImagePreview = (props: ProductImagePreviewProps) => {

    const {file} = props;
    const [objectSrc, setObjectSrc] = useState('');

    useEffect(() => {
        if (!file) {
            setObjectSrc('');
            return;
        }

        const objectUrl = URL.createObjectURL(file);

        setObjectSrc(objectUrl);

        return () => URL.revokeObjectURL(objectUrl);
    }, [file]);

    const src = file ? objectSrc : props.src;
    const name = file ? file.name : props.name;

    if (!src) {
        return <div className={styles.preview}/>;
    }

    const image = (
        <img
            className={styles.image}
            src={src}
            alt={name}
        />
    );

    return (
        <PhotoView src={src}>
            <button
                type={'button'}
                className={styles.button}
                onClick={(event) => event.stopPropagation()}
            >
                {image}
            </button>
        </PhotoView>
    );
};

export default ProductImagePreview;
