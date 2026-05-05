import {Icon24TrashSimpleOutline} from "@vkontakte/icons";
import {Button, ButtonGroup, Text, ModalCard, Spacing, classNames} from "@vkontakte/vkui";
import {useState} from "react";
import {ApiService} from "@/apiService/apiService";
import {useSnackbarStore} from "@/store/snackbar/snackbar";
import {ModalMultiRemoveProps} from "@/components/modals/ModalMultiRemove/types";
import styles from './ModalMultiRemove.module.scss';
import {useShowErrors} from "@/store/showErrors/showErrors";
import {SnackbarItem} from "@/store/snackbar/types";

const urlList = {
    '/users': ApiService.users.delete,
    '/typeProducts': ApiService.guide.typeProducts.delete,
    '/materialGroup': ApiService.guide.materialGroup.delete,
    '/operationGroup': ApiService.guide.operationGroup.delete,
    '/material': ApiService.guide.material.delete,
    '/blank': ApiService.guide.blank.delete,
    '/workGroup': ApiService.guide.workGroup.delete,
    '/operation': ApiService.guide.operation.delete,
    '/work': ApiService.guide.work.delete,
};

const ModalMultiRemove = (props: ModalMultiRemoveProps) => {

    const {
        data,
        url,
        preventClose,
        onClose = () => {},
        ...restProps
    } = props;

    const addSnackbar = useSnackbarStore(state => state.addSnackbar);
    const showErrors = useShowErrors(s => s);

    const [loading, setLoading] = useState(false);

    const onRemove = async () => {
        setLoading(true);

        await urlList[url]({
            ids: data.map(({id}) => id)
        }).then(({status, data: result}) => {
            if (status === 'success') {
                let snackbar: Omit<SnackbarItem, "id"> = {
                    type: 'success',
                    text: `Удалено ${result.success.length} из ${data.length}`
                }

                if (result.error.length === data.length) {
                    snackbar.type = 'error';
                } else if (result.error.length !== 0) {
                    snackbar.type = 'warning';
                }

                if (result.error.length) {
                    snackbar.onActionClick = () => {
                        showErrors.open(data, result);
                        if (result.error.length === data.length) {
                            onClose('cancel');
                        }
                    }
                    snackbar.action = 'Подробнее';
                }

                if (result.error.length !== data.length) {
                    onClose('updated-data');
                }
                addSnackbar(snackbar);
            }
        }).finally(() => setLoading(false));
    };

    return (
        <ModalCard
            onClose={onClose}
            icon={<Icon24TrashSimpleOutline width={56} height={56} fill={'var(--vkui--color_icon_negative)'} />}
            preventClose={preventClose || loading}
            dismissButtonMode={loading ? 'none' : undefined}
            title={`Вы действительно хотите удалить?`}
            actions={
                <>
                    <Spacing size={16} />
                    <ButtonGroup gap="m" stretched>
                        <Button
                            disabled={loading}
                            onClick={(e) => onClose('cancel', e)}
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
