'use client'

import {Button, Search} from "@vkontakte/vkui";
import {Icon24Add} from "@vkontakte/icons";
import Container from "@/components/Container/Container";

const UsersPage = () => {

    return (
        <Container
            header={(
                <>
                    <Button
                        // disabled={loading}
                        before={<Icon24Add/>}
                        // onClick={() => setModal(true)}
                    >
                        Добавить
                    </Button>
                    <Search
                        // disabled={loading}
                        noPadding={true}
                        className={'search'}
                    />
                </>
            )}
        >
            USERS
        </Container>
    )
};

export default UsersPage;
