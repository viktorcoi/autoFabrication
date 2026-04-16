import {DetailInfoRoleProps} from "@/sections/roles/types";
import {useEffect, useRef, useState} from "react";
import {
    Button,
    ButtonGroup,
    Checkbox,
    classNames,
    FormStatus,
    Headline,
    Separator,
    Spinner,
    Title
} from "@vkontakte/vkui";
import styles from './DetailInfoRole.module.scss';
import {ApiService} from "@/apiService/apiService";
import {mergeState} from "@/helpers";
import {GetByIdRoleResponse} from "@/apiService/apiRoles/types";

const DetailInfoRole = (props: DetailInfoRoleProps) => {

    const {
        id,
    } = props;

    const [savedData, setSavedData] = useState<GetByIdRoleResponse | null>(null);
    const [data, setData] = useState<GetByIdRoleResponse | null>(null);
    const [loading, setLoading] = useState({
        get: true,
        send: false,
    });

    const controllerRef = useRef<AbortController>(null);

    useEffect(() => {
        mergeState({get: true}, setLoading);

        const controller = new AbortController();
        controllerRef.current = controller;

        ApiService.roles.getById({
            id: id,
            controller
        }).then(({status, data}) => {
            if (status === 'success') {
                setSavedData(data);
                setData(data);
            }
        }).finally(() => mergeState({get: false}, setLoading));
    }, [id])

    return (
        <div className={styles.wrap}>
            <div className={styles.head}>
                <Title level={'2'}>Управление доступом</Title>
            </div>
            <div className={classNames('scroll', styles.access)}>
                {loading.get ? <Spinner size={'xl'} /> : (
                    <>
                        {!!data?.description && (
                            <FormStatus>{data.description}</FormStatus>
                        )}
                        {data?.permissions && Object.values(data?.permissions).map((permission) => {
                            console.log(permission);

                            return <Checkbox>{permission.id}</Checkbox>
                        })}
                    </>
                )}
            </div>
            {!(loading.get || data?.isConst) && (
                <div
                    className={styles.foot}
                >
                    <ButtonGroup
                        stretched={true}
                        align={'right'}
                    >
                        <Button
                            disabled={loading.get}
                            size={'m'}
                            mode={'secondary'}
                            appearance={'negative'}
                        >
                            Сбросить изменения
                        </Button>
                        <Button
                            disabled={loading.get}
                            size={'m'}
                        >
                            Сохранить
                        </Button>
                    </ButtonGroup>
                </div>
            )}
        </div>
    );
};

export default DetailInfoRole;
