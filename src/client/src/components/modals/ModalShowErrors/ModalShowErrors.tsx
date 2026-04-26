import {
    Button,
    ButtonGroup,
    ModalPage,
    ModalPageHeader,
    PlatformProvider,
} from "@vkontakte/vkui";
import {ModalShowErrorsProps} from "@/components/modals/ModalShowErrors/types";
import Table from "@/components/Table/Table";
import styles from "./ModalShowErrors.module.scss";

const ModalShowErrors = (props: ModalShowErrorsProps) => {

    const {
        onClose,
        ...restProps
    } = props;

    const data = [
        {id: 1, status: 'success', name: 'AASS', description: 'AASS'},
    ]

    return (
        <ModalPage
            className={styles.modal}
            onClose={onClose}
            // header={
            //     <PlatformProvider
            //         value={'ios'}
            //     >
            //         <ModalPageHeader>
            //             Сбросить пароль
            //         </ModalPageHeader>
            //     </PlatformProvider>
            // }
            // footer={(
            //     <div className={'modalFooter'}>
            //         <ButtonGroup
            //             stretched={true}
            //             align={'right'}
            //         >
            //             <Button
            //                 size={'m'}
            //                 mode={'secondary'}
            //                 onClick={(e) => {
            //                     onClose('cancel', e);
            //                 }}
            //             >
            //                 Закрыть
            //             </Button>
            //         </ButtonGroup>
            //     </div>
            // )}
            {...restProps}
        >
            <div className={styles.wrap}>
                <Table
                    page={0}
                    rows={1000}
                    total={0}
                    hideFooter={true}
                    columns={[
                        {key: 'status', header: 'Статус', size: 80, minSize: 80, maxSize: 80, isConst: true},
                        {key: 'name', header: 'Название', size: 150, minSize: 150, maxSize: 400},
                        {key: 'description', header: 'Описание', size: 120, minSize: 100, maxSize: 400},
                    ]}
                    data={data}
                    onEvent={() => {}}
                />
            </div>
        </ModalPage>
    )
}

export default ModalShowErrors;
