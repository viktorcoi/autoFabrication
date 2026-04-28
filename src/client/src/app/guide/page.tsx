'use client'

import Container from "@/components/Container/Container";
import styles from './page.module.scss';
import {classNames, FormStatus, Placeholder, SimpleCell} from "@vkontakte/vkui";
import {useState} from "react";
import TypeProducts from "@/sections/guide/TypeProducts";

const sections = [
    {
        id: 1,
        name: "Типы изделий",
    },
    {
        id: 2,
        name: "Группы материалов",
    },
    {
        id: 3,
        name: "Материалы",
    },
    {
        id: 4,
        name: "Заготовки",
    },
    {
        id: 5,
        name: "Группы операций",
    },
    {
        id: 6,
        name: "Операции",
    },
    {
        id: 7,
        name: "Группы работ",
    },
    {
        id: 8,
        name: "Работы",
    }
]

const GuidePage = () => {

    const [activeSection, setActiveSection] = useState(1);

    return (
        <Container>
            <div className={styles.wrap}>
                <div className={classNames('island scroll', styles.list)}>
                    {sections.map(({id, name}) => (
                        <SimpleCell
                            key={id}
                            className={classNames(
                                activeSection === id && 'activated',
                                // loading.permissions && 'disabled'
                            )}
                            activated={activeSection === id}
                            onClick={() => setActiveSection(id)}
                        >
                            {name}
                        </SimpleCell>
                    ))}
                </div>
                {activeSection === 1 ? (
                    <TypeProducts/>
                ) : <Placeholder
                    stretched={true}
                >
                    <FormStatus mode={'error'}>
                        Сань ну ты тоже не охуевай, я не киборг, чтобы еще и это сделать
                    </FormStatus>

                </Placeholder>}
            </div>
        </Container>
    )
}

export default GuidePage;
