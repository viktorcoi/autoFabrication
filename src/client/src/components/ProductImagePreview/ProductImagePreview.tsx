import {useEffect, useState} from "react";
import {PhotoView} from "react-photo-view";
import {ProductImagePreviewProps} from "@/components/ProductImagePreview/types";
import styles from './ProductImagePreview.module.scss';

const ProductImagePreview = ({file}: ProductImagePreviewProps) => {

    const [src, setSrc] = useState('');

    useEffect(() => {
        const objectUrl = URL.createObjectURL(file);

        setSrc(objectUrl);

        return () => URL.revokeObjectURL(objectUrl);
    }, [file]);

    if (!src) {
        return <div className={styles.preview}/>;
    }

    const image = (
        <img
            className={styles.image}
            src={src}
            alt={file.name}
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
