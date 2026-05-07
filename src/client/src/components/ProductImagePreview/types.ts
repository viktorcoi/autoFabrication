export type ProductImagePreviewProps = {
    file: File;
    src?: never;
    name?: never;
} | {
    file?: never;
    src: string;
    name: string;
};
