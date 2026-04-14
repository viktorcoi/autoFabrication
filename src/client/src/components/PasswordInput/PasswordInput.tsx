import {IconButton, Input, Tooltip} from "@vkontakte/vkui";
import {PasswordInputProps} from "@/components/PasswordInput/types";
import {useEffect, useMemo, useState} from "react";
import {Icon16Hide, Icon16View} from "@vkontakte/icons";

const PasswordInput = (props: PasswordInputProps) => {

    const {
        after: afterProps,
        placeholder = 'Введите пароль',
        defaultShow = false,
        ...restProps
    } = props;

    const [show, setShow] = useState(false);

    useEffect(() => {
        setShow(defaultShow);
    }, [defaultShow]);

    const after = useMemo(() => (
        <>
            <Tooltip
                description={`${show ? 'Скрыть' : 'Показать'} пароль`}
                usePortal={true}
                placement={'top'}
            >
                <IconButton
                    onClick={e => {
                        e.stopPropagation();
                        e.preventDefault();
                        setShow(prevState => !prevState);
                    }}
                    label={`${show ? 'Скрыть' : 'Показать'} пароль`}
                >
                    {show ? <Icon16Hide width={20} height={20}/> : <Icon16View width={20} height={20}/>}
                </IconButton>
            </Tooltip>
            {afterProps}
        </>
    ), [afterProps, show]);

    return (
        <Input
            placeholder={placeholder}
            {...restProps}
            after={after}
            type={show ? 'text' : 'password'}
        />
    )
};

export default PasswordInput;
