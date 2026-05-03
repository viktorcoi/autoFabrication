import {
    Button,
    ButtonGroup, classNames,
    CustomSelectOptionInterface,
    FormItem,
    Input,
    ModalPage,
    ModalPageHeader,
    PlatformProvider,
    Select,
    Spinner,
    Textarea
} from "@vkontakte/vkui";
import {SubmitEvent, useEffect, useMemo, useState} from "react";
import styles from './ModalManageWorkGroup.module.scss'
import {mergeState} from "@/shared/helpers";
import {ApiService} from "@/apiService/apiService";
import {useSnackbarStore} from "@/store/snackbar/snackbar";
import {useController, useSelectFilter} from "@/shared/hooks";
import {ModalManageWorkGroupProps} from "@/components/modals/ModalGuide/ModalManageWorkGroup/types";
import {PostWorkGroupOptions} from "@/apiService/apiGuide/types";

const initialData: PostWorkGroupOptions = {
    operationId: 0,
    name: "",
    description: "",
};

const ModalManageWorkGroup = (props: ModalManageWorkGroupProps) => {

    const {
        idWorkGroup,
        preventClose,
        onLoading,
        onClose = () => {},
        ...restProps
    } = props;

    const addSnackbar = useSnackbarStore(state => state.addSnackbar);
    const selectFilter = useSelectFilter();

    const [savedData, setSavedData] = useState({...initialData});
    const [data, setData] = useState({...initialData});
    const [operations, setOperations] = useState<CustomSelectOptionInterface[]>([]);
    const [loading, setLoading] = useState({
        get: true,
        send: false
    });

    const { createController } = useController([]);

    useEffect(() => {
        const controller = createController();

        ApiService.guide.operation.get({
            controller
        }).then(async ({status, data}) => {
            if (status === 'success') {
                setOperations(data.map(({id, name}) => ({
                    value: id,
                    label: name,
                })));

                if (idWorkGroup !== null) {
                    await ApiService.guide.workGroup.getById({
                        id: idWorkGroup,
                        controller
                    }).then(({status, data}) => {
                        if (status === 'success') {
                            const init = {
                                operationId: data.operationId,
                                name: data.name,
                                description: data.description ?? '',
                            };

                            setSavedData(init);
                            setData(init);
                        } else onClose('error')
                    });
                }
            } else onClose('error')
        }).finally(() => mergeState({get: false}, setLoading));
    }, [idWorkGroup])

    const saveWorkGroup = async (e: SubmitEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (disabledSave || loading.send) return;

        mergeState({send: true}, setLoading);
        onLoading(true);

        try {
            const { status } = idWorkGroup === null ? await ApiService.guide.workGroup.post({
                options: {
                    operationId: data.operationId,
                    name: data.name.trim(),
                    description: data.description.trim(),
                }
            }) : await ApiService.guide.workGroup.patch({
                id: idWorkGroup,
                options: {
                    operationId: data.operationId,
                    name: data.name.trim(),
                    description: data.description.trim(),
                }
            });

            if (status === 'success') {
                addSnackbar({
                    type: 'success',
                    text: `Успешно ${idWorkGroup === null ? 'добавлено' : 'отредактировано'}: "${data.name}"`
                });

                onClose('updated-data');
            }
        } finally {
            mergeState({send: false}, setLoading);
            onLoading(false);
        }
    }

    const title = useMemo(
        () => `${idWorkGroup === null ? 'Добавление' : 'Редактирование'} группы работ`,
        [idWorkGroup]
    );

    const disabledSave = useMemo(() => {
        const validRequired = !!data.name.trim() && !!data.operationId;
        const validEdit = validRequired && (
            data.operationId !== savedData.operationId ||
            data.name.trim() !== savedData.name.trim() ||
            data.description.trim() !== savedData.description.trim()
        );

        return idWorkGroup === null ? !validRequired : !validEdit;
    }, [idWorkGroup, data, savedData]);

    return (
        <ModalPage
            hideCloseButton={loading.send}
            onClose={onClose}
            preventClose={preventClose}
            header={
                <PlatformProvider value={'ios'}>
                    <ModalPageHeader>{title}</ModalPageHeader>
                </PlatformProvider>
            }
            footer={(
                <div className={'modalFooter'}>
                    <ButtonGroup
                        stretched={true}
                        align={'right'}
                    >
                        <Button
                            disabled={loading.send}
                            size={'m'}
                            mode={'secondary'}
                            onClick={(e) => {
                                if (preventClose) return;
                                onClose('cancel', e);
                            }}
                        >
                            Отмена
                        </Button>
                        <Button
                            form={'save-work-group'}
                            type={'submit'}
                            disabled={disabledSave || loading.get}
                            loading={loading.send}
                            size={'m'}
                        >
                            Сохранить
                        </Button>
                    </ButtonGroup>
                </div>
            )}
            {...restProps}
        >
            {loading.get ? <Spinner size={'xl'} className={styles.plug}/> : (
                <form id={'save-work-group'} className={'modalForm'} onSubmit={saveWorkGroup}>
                    <FormItem
                        top={'Операция'}
                        noPadding={true}
                    >
                        <Select
                            filterFn={selectFilter.filterFn}
                            options={operations}
                            searchable={true}
                            disabled={loading.send}
                            className={classNames(loading.send && 'disabled')}
                            value={data.operationId}
                            onChange={(e) => mergeState({operationId: Number(e.target.value)}, setData)}
                            placeholder={'Выберите операцию'}
                            status={!data.operationId ? 'error' : 'default'}
                            onInputChange={selectFilter.onInputChange}
                            onOpen={selectFilter.onOpen}
                            onClose={selectFilter.onClose}
                        />
                    </FormItem>
                    <FormItem
                        top={'Название'}
                        noPadding={true}
                    >
                        <Input
                            disabled={loading.send}
                            value={data.name}
                            onChange={(e) => mergeState({name: e.target.value}, setData)}
                            placeholder={'Введите название'}
                            status={!data.name.trim() ? 'error' : 'default'}
                            maxLength={30}
                        />
                    </FormItem>
                    <FormItem
                        className={'count-symbols'}
                        top={'Описание'}
                        noPadding={true}
                        bottom={`${data.description.length} из 255`}
                    >
                        <Textarea
                            disabled={loading.send}
                            value={data.description}
                            onChange={(e) => mergeState({description: e.target.value}, setData)}
                            className={styles.textarea}
                            placeholder={'Введите описание'}
                            maxLength={255}
                        />
                    </FormItem>
                </form>
            )}
        </ModalPage>
    )
};

export default ModalManageWorkGroup;
