"use client";

import { FormStatus, Title} from "@vkontakte/vkui";
import {
    Icon24DrillOutline,
    Icon24HammerOutline,
    Icon56SettingsOutline,
    Icon56WrenchOutline,
} from "@vkontakte/icons";
import styles from "./not-found.module.scss";

const NotFoundPage = () => {

    return (
        <div className={styles.wrap}>
            <div className={styles.error}>
                <div className={styles.code}>
                    <div className={styles.box}>
                        <div className={styles.symbol}>
                            <Title Component={'span'}>4</Title>
                            <svg className={styles.second} width="26" height="24" viewBox="0 0 26 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M7.78539 21.3341L7.51501 20.8809C7.40446 20.9483 7.32276 21.0551 7.28578 21.1806L7.78539 21.3341ZM10.8588 19.4587L11.1292 19.9119C11.2488 19.8389 11.3342 19.7201 11.3663 19.5822L10.8588 19.4587ZM11.6529 16.0451L11.4233 15.5694C11.2831 15.6384 11.1811 15.7676 11.1454 15.9215L11.6529 16.0451ZM14.7161 14.5366L14.9456 15.0122C15.0703 14.9508 15.1654 14.8415 15.2099 14.7084L14.7161 14.5366ZM15.7227 11.5276L15.4212 11.095C15.3315 11.159 15.2642 11.2503 15.2289 11.3558L15.7227 11.5276ZM18.7481 9.36757L19.0496 9.80021C19.1456 9.73164 19.2158 9.63204 19.2487 9.51761L18.7481 9.36757ZM21.4336 1.9164C21.5141 1.63648 21.3552 1.34238 21.0787 1.25951C20.8022 1.17665 20.5128 1.33639 20.4324 1.61632L20.933 1.76636L21.4336 1.9164ZM7.26259 23.1075L7.7622 23.261L8.285 21.4876L7.78539 21.3341L7.28578 21.1806L6.76298 22.954L7.26259 23.1075ZM7.78539 21.3341L8.05577 21.7873L11.1292 19.9119L10.8588 19.4587L10.5884 19.0055L7.51501 20.8809L7.78539 21.3341ZM10.8588 19.4587L11.3663 19.5822L12.1603 16.1686L11.6529 16.0451L11.1454 15.9215L10.3513 19.3351L10.8588 19.4587ZM11.6529 16.0451L11.8824 16.5207L14.9456 15.0122L14.7161 14.5366L14.4865 14.0609L11.4233 15.5694L11.6529 16.0451ZM14.7161 14.5366L15.2099 14.7084L16.2166 11.6995L15.7227 11.5276L15.2289 11.3558L14.2223 14.3647L14.7161 14.5366ZM15.7227 11.5276L16.0242 11.9602L19.0496 9.80021L18.7481 9.36757L18.4466 8.93493L15.4212 11.095L15.7227 11.5276ZM18.7481 9.36757L19.2487 9.51761L21.4336 1.9164L20.933 1.76636L20.4324 1.61632L18.2475 9.21753L18.7481 9.36757Z" fill="currentColor"/>
                                <path d="M11.3533 17.5636L8.12376 12.9614L4.34598 10.5412" stroke="currentColor" strokeWidth="0.72" strokeLinecap="round" strokeLinejoin="round"/>
                                <path d="M8.89879 20.244L4.50004 18.5001L2.5 15" stroke="currentColor" strokeWidth="0.72" strokeLinecap="round" strokeLinejoin="round"/>
                                <path d="M8.20252 21.2736L11.9745 21.5059L17.9625 23.4989L25.5 22" stroke="currentColor" strokeWidth="0.72" strokeLinecap="round" strokeLinejoin="round"/>
                                <path d="M3.49992 17L3.5 13.5L1 10.5" stroke="currentColor" strokeWidth="0.58" strokeLinecap="round" strokeLinejoin="round"/>
                                <path d="M13.668 21.9878L17.4614 21.3864L21 20" stroke="currentColor" strokeWidth="0.58" strokeLinecap="round" strokeLinejoin="round"/>
                                <path d="M7.96366 12.5083L4.7425 8.99987L3.00004 8.49986" stroke="currentColor" strokeWidth="0.58" strokeLinecap="round" strokeLinejoin="round"/>
                                <path d="M17.9624 23.499L18.1962 26.1652L19.4579 28.0839" stroke="currentColor" strokeWidth="0.36" strokeLinecap="round" strokeLinejoin="round"/>
                                <path d="M18.5906 16.202L22.0384 16.9705L24.1219 15.971" stroke="currentColor" strokeWidth="0.36" strokeLinecap="round" strokeLinejoin="round"/>
                                <path d="M13.5 17.5L17.5 19.0001L18 20" stroke="currentColor" strokeWidth="0.36" strokeLinecap="round" strokeLinejoin="round"/>
                                <path d="M18.5906 16.202L22.0384 16.9705L24.1219 15.971" stroke="currentColor" strokeWidth="0.36" strokeLinecap="round" strokeLinejoin="round"/>
                                <path d="M15.789 11.8735L13.6667 8.703L13.8654 4.1687M10 15.5L11 13.5L10.5 11.8735" stroke="currentColor" strokeWidth="0.44" strokeLinecap="round" strokeLinejoin="round"/>
                                <path d="M14.7162 14.5366L18.1779 15.8143L19.8502 18.9731" stroke="currentColor" strokeWidth="0.44" strokeLinecap="round" strokeLinejoin="round"/>
                                <path d="M12.3225 15.823L13.5001 17.5001L17.5 18" stroke="currentColor" strokeWidth="0.44" strokeLinecap="round" strokeLinejoin="round"/>
                                <path d="M20.0388 5.11649L18.424 2.81537L15.994 1.66635" stroke="currentColor" strokeWidth="0.36" strokeLinecap="round" strokeLinejoin="round"/>
                                <path d="M19.0986 8.40425L21.8781 9.05951L24.5814 8.74739" stroke="currentColor" strokeWidth="0.36" strokeLinecap="round" strokeLinejoin="round"/>
                                <path d="M4.8705 21.8135L7.46287 21.8135L10.1295 22.8436L10.1294 23.903L6.30318 23.9031L3.00016 23.5001" fill="currentColor"/>
                            </svg>
                        </div>
                        <Icon24DrillOutline
                            className={styles.icon}
                            width={60}
                            height={60}
                        />
                    </div>
                    <div className={styles.box}>
                        <Icon56SettingsOutline
                            className={styles.icon}
                            width={160}
                            height={160}
                        />
                        <Icon56WrenchOutline
                            className={styles.second}
                            width={80}
                            height={80}
                        />
                    </div>
                    <div className={styles.box}>
                        <div className={styles.symbol}>
                            <Title Component={'span'}>4</Title>
                            <svg className={styles.second} width="40" height="29" viewBox="0 0 40 29" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M14.7257 3.27499L15.2011 3.45113C15.2093 3.35554 15.1734 3.24711 15.1002 3.14685L14.7257 3.27499ZM14.4996 5.93338L14.0242 5.75725C14.0154 5.86071 14.0582 5.97881 14.1431 6.08505L14.4996 5.93338ZM16.5995 8.56292L17.0702 8.77275C17.0927 8.66246 17.0509 8.52982 16.9561 8.41132L16.5995 8.56292ZM16.1084 10.9733L15.6378 10.7635C15.6178 10.8616 15.6486 10.9778 15.7234 11.0866L16.1084 10.9733ZM17.799 13.4323L18.2755 13.5804C18.2753 13.4967 18.2432 13.4052 18.1839 13.3189L17.799 13.4323ZM17.8077 16.2573L17.3311 16.1092C17.3314 16.1988 17.3681 16.2972 17.4352 16.3882L17.8077 16.2573ZM21.8932 22.4353C22.0573 22.658 22.3572 22.7799 22.5629 22.7076C22.7687 22.6353 22.8024 22.3962 22.6382 22.1735L22.2657 22.3044L21.8932 22.4353ZM13.6925 1.85817L13.318 1.98631L14.3512 3.40312L14.7257 3.27499L15.1002 3.14685L14.067 1.73003L13.6925 1.85817ZM14.7257 3.27499L14.2503 3.09885L14.0242 5.75725L14.4996 5.93338L14.975 6.10951L15.2011 3.45113L14.7257 3.27499ZM14.4996 5.93338L14.1431 6.08505L16.243 8.71454L16.5995 8.56292L16.9561 8.41132L14.8562 5.78178L14.4996 5.93338ZM16.5995 8.56292L16.129 8.35311L15.6378 10.7635L16.1084 10.9733L16.579 11.1831L17.0702 8.77275L16.5995 8.56292ZM16.1084 10.9733L15.7234 11.0866L17.4139 13.5456L17.799 13.4323L18.1839 13.3189L16.4934 10.86L16.1084 10.9733ZM17.799 13.4323L17.3224 13.2841L17.3311 16.1092L17.8077 16.2573L18.2843 16.4055L18.2755 13.5804L17.799 13.4323ZM17.8077 16.2573L17.4352 16.3882L21.8932 22.4353L22.2657 22.3044L22.6382 22.1735L18.1802 16.1264L17.8077 16.2573Z" fill="currentColor"/>
                                <path d="M1.21231 9.36981L1.39197 9.59567C1.33414 9.66335 1.2618 9.7078 1.18897 9.72039L1.21231 9.36981ZM2.82074 7.48846L2.64109 7.26258C2.70369 7.18937 2.78303 7.14361 2.8613 7.13551L2.82074 7.48846ZM4.758 7.28832L4.95776 7.48899C4.89299 7.57642 4.80482 7.63232 4.7175 7.64128L4.758 7.28832ZM6.17372 5.37801L5.97399 5.17742C6.03162 5.09965 6.10802 5.04644 6.18635 5.02955L6.17372 5.37801ZM7.94462 4.99563L8.10716 5.24038C8.0554 5.29439 7.99408 5.33068 7.93199 5.34409L7.94462 4.99563ZM9.69102 3.17432L9.52847 2.92956C9.5839 2.87177 9.65013 2.83434 9.71636 2.82341L9.69102 3.17432ZM14.1161 2.09789C14.2781 2.07114 14.3981 2.20659 14.3841 2.40041C14.3701 2.59423 14.2274 2.77302 14.0654 2.7997L14.0908 2.44879L14.1161 2.09789ZM0.183136 9.54784L0.206476 9.19726L1.23565 9.01923L1.21231 9.36981L1.18897 9.72039L0.159796 9.89842L0.183136 9.54784ZM1.21231 9.36981L1.03265 9.14394L2.64109 7.26258L2.82074 7.48846L3.00039 7.71434L1.39197 9.59567L1.21231 9.36981ZM2.82074 7.48846L2.8613 7.13551L4.79853 6.93544L4.758 7.28832L4.7175 7.64128L2.78024 7.84142L2.82074 7.48846ZM4.758 7.28832L4.55827 7.08773L5.97399 5.17742L6.17372 5.37801L6.37348 5.57868L4.95776 7.48899L4.758 7.28832ZM6.17372 5.37801L6.18635 5.02955L7.95723 4.64709L7.94462 4.99563L7.93199 5.34409L6.16114 5.72648L6.17372 5.37801ZM7.94462 4.99563L7.78209 4.75088L9.52847 2.92956L9.69102 3.17432L9.85358 3.41908L8.10716 5.24038L7.94462 4.99563ZM9.69102 3.17432L9.71636 2.82341L14.1161 2.09789L14.0908 2.44879L14.0654 2.7997L9.66568 3.52523L9.69102 3.17432Z" fill="currentColor"/>
                                <path d="M38.1473 3.25476L38.1241 2.96796C38.2101 2.94347 38.2951 2.9463 38.3628 2.97591L38.1473 3.25476ZM35.7571 3.93489L35.7803 4.22169C35.6873 4.24815 35.5957 4.24257 35.526 4.20623L35.7571 3.93489ZM34.0334 3.03524L33.9794 2.75834C34.0821 2.72124 34.1868 2.72325 34.2644 2.76386L34.0334 3.03524ZM31.7873 3.84553L31.8413 4.12234C31.7499 4.15533 31.6566 4.15756 31.5819 4.12851L31.7873 3.84553ZM30.1 3.18906L30.1017 2.89596C30.1749 2.87952 30.2462 2.88307 30.3054 2.90608L30.1 3.18906ZM27.6286 3.74331L27.627 4.03642C27.5486 4.05399 27.4725 4.04869 27.4113 4.02133L27.6286 3.74331ZM23.3449 2.20358C23.1952 2.13666 23.1711 1.95792 23.2911 1.80436C23.4111 1.6508 23.6298 1.58058 23.7795 1.64755L23.5622 1.92556L23.3449 2.20358ZM39.1032 3.67303L38.8877 3.95188L37.9319 3.5336L38.1473 3.25476L38.3628 2.97591L39.3186 3.39419L39.1032 3.67303ZM38.1473 3.25476L38.1705 3.54155L35.7803 4.22169L35.7571 3.93489L35.7339 3.64808L38.1241 2.96796L38.1473 3.25476ZM35.7571 3.93489L35.526 4.20623L33.8023 3.30654L34.0334 3.03524L34.2644 2.76386L35.9882 3.66351L35.7571 3.93489ZM34.0334 3.03524L34.0874 3.31206L31.8413 4.12234L31.7873 3.84553L31.7333 3.56863L33.9794 2.75834L34.0334 3.03524ZM31.7873 3.84553L31.5819 4.12851L29.8947 3.47212L30.1 3.18906L30.3054 2.90608L31.9926 3.56251L31.7873 3.84553ZM30.1 3.18906L30.0984 3.48215L27.627 4.03642L27.6286 3.74331L27.6302 3.4502L30.1017 2.89596L30.1 3.18906ZM27.6286 3.74331L27.4113 4.02133L23.3449 2.20358L23.5622 1.92556L23.7795 1.64755L27.8459 3.46529L27.6286 3.74331Z" fill="currentColor"/>
                                <path d="M15.3848 6.86863L23.6218 4.96781L34.1318 7.81177" stroke="currentColor" strokeWidth="0.22" strokeLinecap="round" strokeLinejoin="round"/>
                                <path d="M28.2899 6.28642L32.0753 9.69383L38.9966 9.38037" stroke="currentColor" strokeWidth="0.28" strokeLinecap="round" strokeLinejoin="round"/>
                                <path d="M7.84766 9.99512L9.70448 6.54145L9.8024 3.05267" stroke="currentColor" strokeWidth="0.36" strokeLinecap="round" strokeLinejoin="round"/>
                                <path d="M13.9132 22.5017L9.30986 25.0717L8.1114 28.0499" stroke="currentColor" strokeWidth="0.36" strokeLinecap="round" strokeLinejoin="round"/>
                                <path d="M30.7041 10.0654L24.7053 12.4547L23.0767 11.9625" stroke="currentColor" strokeWidth="0.36" strokeLinecap="round" strokeLinejoin="round"/>
                                <path d="M25.3444 12.9587L20.741 15.5288L19.5426 18.507" stroke="currentColor" strokeWidth="0.36" strokeLinecap="round" strokeLinejoin="round"/>
                                <path d="M20.5 20L14.7843 22.4818L9.5381 21.016" stroke="currentColor" strokeWidth="0.44" strokeLinecap="round" strokeLinejoin="round"/>
                                <path d="M17.25 15.8562L14.1477 15.3569L9.23076 18.7197" stroke="currentColor" strokeWidth="0.44" strokeLinecap="round" strokeLinejoin="round"/>
                                <path d="M16.9231 11.5242L21.1787 12.2103L25.0801 10.9902" stroke="currentColor" strokeWidth="0.36" strokeLinecap="round" strokeLinejoin="round"/>
                                <path d="M15.938 9.7959L12.1883 11.833L9.56823 14.7385" stroke="currentColor" strokeWidth="0.36" strokeLinecap="round" strokeLinejoin="round"/>
                                <path d="M33.8455 0.391779L37.6924 1.52637L27.6924 2.28952L23.8462 2.28952L20.7693 3.05197L16.1539 3.83366L14.6145 5.34144L9.99922 2.28952L5.38469 2.28952L2.30777 0.391778L9.99922 0.391696L18.4608 0.391693L33.8455 0.391779Z" fill="currentColor"/>
                            </svg>
                        </div>
                        <Icon24HammerOutline
                            className={styles.icon}
                            width={70}
                            height={70}
                        />
                    </div>
                </div>
                <FormStatus
                    className={styles.status}
                    mode={'error'}
                    title={'Страница не найдена'}
                >
                    Выберите доступный модуль из меню
                </FormStatus>
            </div>
        </div>
    );
};

export default NotFoundPage;
