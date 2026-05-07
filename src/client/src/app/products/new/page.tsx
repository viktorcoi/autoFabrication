'use client'

import {
    Button,
    classNames,
    FormItem,
    Input, Placeholder,
    Select, Subhead, Textarea,
    Title,
    Tooltip
} from "@vkontakte/vkui";
import Link from "next/link";
import {
    Icon24Add,
    Icon24BrowserBack,
} from "@vkontakte/icons";
import {mergeState} from "@/shared/helpers";
import Container from "@/components/Container/Container";
import React from "react";
import styles from '../page.module.scss';
import UploadFile from "@/components/UploadFile/UploadFile";

const ProductNewPage = () => {



    return (
        <Container
            header={(
                <>
                    <div className={styles.header}>
                        <Tooltip
                            description={'Вернуться к изделиям'}
                            usePortal={true}
                            placement={"top"}
                            disableTriggerOnFocus={true}
                        >
                            <div>
                                <Link
                                    href={'/products'}
                                >
                                    <Button
                                        mode={'secondary'}
                                        size={'m'}
                                        before={<Icon24BrowserBack/>}
                                    />
                                </Link>
                            </div>
                        </Tooltip>
                        <Title level={'3'} weight={'2'}>Добавление изделия</Title>
                    </div>
                    <Button
                        size={'m'}
                    >
                        Сохранить
                    </Button>
                </>
            )}
        >
            <div className={styles.wrap}>
                <div className={classNames('island', 'scroll', styles.wrap__left)}>
                    <FormItem
                        top={'Название изделия'}
                        noPadding={true}
                    >
                        <Input  />
                    </FormItem>
                    <FormItem
                        top={'Тип изделия'}
                        noPadding={true}
                    >
                        <Select options={[]} />
                    </FormItem>
                    <FormItem
                        top={'Материал'}
                        noPadding={true}
                    >
                        <Select options={[]} />
                    </FormItem>
                    <UploadFile
                        maxSize={20}
                    />
                    <FormItem
                        className={'count-symbols'}
                        top={'Описание'}
                        noPadding={true}
                        // bottom={`${data.description.length} из 255`}
                    >
                        <Textarea
                            // disabled={loading.send}
                            // value={data.description}
                            onChange={(e) => mergeState({description: e.target.value}, setData)}
                            className={styles.textarea}
                            placeholder={'Введите описание'}
                            maxLength={255}
                        />
                    </FormItem>
                    <div className={styles.bond}>
                        <div className={styles.bond__head}>
                            <Subhead>Связанные изделия</Subhead>
                            <Button
                                mode={'secondary'}
                                before={<Icon24Add width={20} height={20}/>}
                            >
                                Добавить
                            </Button>
                        </div>
                        {/*Рендер связанных изделий просто див оставь, я потом дорисую дизайн, а ты напишешь логику (там же еще и коунт у нас) */}
                        <Placeholder>Нет связанных изделий</Placeholder>
                    </div>
                </div>
                <div className={classNames('island', styles.wrap__right)}>

                </div>
            </div>

        </Container>
    )
};

export default ProductNewPage;
