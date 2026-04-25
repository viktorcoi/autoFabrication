import type {Area} from "react-easy-crop";

const createImage = (url: string) => new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();

    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Не удалось прочитать изображение'));
    image.src = url;
});

const getCroppedAvatarName = (fileName: string) => {
    const nameWithoutExtension = fileName.replace(/\.[^/.]+$/, '');

    return `${nameWithoutExtension || 'avatar'}-cropped.png`;
};

export const getCroppedAvatarFile = async (
    imageSrc: string,
    crop: Area,
    fileName: string,
) => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    if (!context) {
        throw new Error('Не удалось подготовить изображение');
    }

    canvas.width = 512;
    canvas.height = 512;

    context.drawImage(
        image,
        crop.x,
        crop.y,
        crop.width,
        crop.height,
        0,
        0,
        512,
        512,
    );

    const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((nextBlob) => {
            if (nextBlob) {
                resolve(nextBlob);
                return;
            }

            reject(new Error('Не удалось обрезать изображение'));
        }, 'image/png');
    });

    return new File([blob], getCroppedAvatarName(fileName), {
        type: 'image/png',
        lastModified: Date.now(),
    });
};
