import {Icon24TrashSimpleOutline} from "@vkontakte/icons";
import {Button, ButtonGroup, Text, ModalCard, Spacing, classNames} from "@vkontakte/vkui";
import {useState} from "react";
import {ApiService} from "@/apiService/apiService";
import {useSnackbarStore} from "@/store/snackbar/snackbar";
import {ModalMultiRemoveProps} from "@/components/modals/ModalMultiRemove/types";
import styles from './ModalMultiRemove.module.scss';

const urlList = {
    '/users': ApiService.users.delete,
};

const ModalMultiRemove = (props: ModalMultiRemoveProps) => {

    const {
        data,
        url,
        preventClose,
        onLoading,
        onClose = () => {},
        ...restProps
    } = props;

    const addSnackbar = useSnackbarStore(state => state.addSnackbar)

    const [loading, setLoading] = useState(false);

    const onRemove = async () => {
        setLoading(true);
        onLoading(true);

        await urlList[url]({
            ids: data.map(({id}) => id)
        }).then(({status, data}) => {
            if (status === 'success') {
                if (typeof data === 'object' && data.error.length) {
                    addSnackbar({
                        type: 'error',
                        text: data.error[0].description,
                    });
                    return;
                }

                addSnackbar({
                    type: 'success',
                    text: `Успешно удалено: "${name}"`
                });
                onClose('updated-data');
            }
        }).finally(() => {
            setLoading(false);
            onLoading(false);
        });
    };

    return (
        <ModalCard
            onClose={onClose}
            icon={<Icon24TrashSimpleOutline width={56} height={56} fill={'var(--vkui--color_icon_negative)'} />}
            preventClose={preventClose}
            dismissButtonMode={loading ? 'none' : undefined}
            title={`Вы действительно хотите удалить?`}
            actions={
                <>
                    <Spacing size={16} />
                    <ButtonGroup gap="m" stretched>
                        <Button
                            disabled={loading}
                            onClick={(e) => {
                                if (preventClose) return;
                                onClose('cancel', e);
                            }}
                            mode={'secondary'}
                            stretched={true}
                            size={'l'}
                        >
                            Отмена
                        </Button>
                        <Button
                            appearance={'negative'}
                            stretched={true}
                            size={'l'}
                            loading={loading}
                            onClick={onRemove}
                        >
                            Удалить
                        </Button>
                    </ButtonGroup>
                </>
            }
            {...restProps}
        >
            <div className={classNames(
                'scroll',
                styles.list
            )}>
                {data.map(({name}, key) => (
                    <Text key={key}>{`${key + 1}. ${name}`}</Text>
                ))}
            </div>
        </ModalCard>
    )
};

export default ModalMultiRemove;
