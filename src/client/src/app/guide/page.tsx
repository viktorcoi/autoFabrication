'use client'

import Container from "@/components/Container/Container";
import styles from './page.module.scss';
import {classNames, SimpleCell} from "@vkontakte/vkui";
import {useState} from "react";
import TypeProducts from "@/sections/guide/TypeProducts";
import MaterialGroup from "@/sections/guide/MaterialGroup";
import OperationGroup from "@/sections/guide/OperationGroup";

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
    const [loading, setLoading] = useState(false);

    return (
        <Container>
            <div className={styles.wrap}>
                <div className={classNames('island scroll', styles.list)}>
                    {sections.map(({id, name}) => (
                        <SimpleCell
                            key={id}
                            className={classNames(
                                activeSection === id && 'activated',
                                loading && 'disabled'
                            )}
                            activated={activeSection === id}
                            onClick={() => setActiveSection(id)}
                        >
                            {name}
                        </SimpleCell>
                    ))}
                </div>
                {activeSection === 1 ? (
                    <TypeProducts onLoading={setLoading} />
                ) : activeSection === 2 ? (
                    <MaterialGroup onLoading={setLoading} />
                ) : activeSection === 5 ? (
                    <OperationGroup onLoading={setLoading} />
                ) : null}
            </div>
        </Container>
    )
}

export default GuidePage;
