import {Icon24TrashSimpleOutline} from "@vkontakte/icons";
import {Button, ButtonGroup, ModalCard, Spacing} from "@vkontakte/vkui";
import {ModalManageRoleProps} from "@/components/modals/ModalRemove/types";
import {useState} from "react";
import {ApiService} from "@/apiService/apiService";
import {useSnackbarStore} from "@/store/snackbar/snackbar";
import {SnackbarItem} from "@/store/snackbar/types";

const urlList = {
    '/roles': (id: number) => ApiService.roles.delete({ id }),
    '/users': (id: number) => ApiService.users.delete({ ids: [id] }),
    '/typeProducts': (id: number) => ApiService.guide.typeProducts.delete({ ids: [id] }),
    '/materialGroup': (id: number) => ApiService.guide.materialGroup.delete({ ids: [id] }),
};

const ModalRemove = (props: ModalManageRoleProps) => {

    const {
        name,
        url,
        preventClose,
        removeId,
        mode,
        onLoading,
        onClose = () => {},
        ...restProps
    } = props;

    const addSnackbar = useSnackbarStore(state => state.addSnackbar)

    const [loading, setLoading] = useState(false);

    const onRemove = async () => {
        setLoading(true);
        onLoading(true);

        await urlList[url](removeId).then(({status, data}) => {
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
            title={`Вы действительно хотите удалить "${name}"?`}
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
        />
    )
};

export default ModalRemove;
