"use client";

import { FormStatus } from "@vkontakte/vkui";
import Container from "@/components/Container/Container";
import styles from "./page.module.scss";

const ForbiddenPage = () => {
	return (
		<Container>
			<div className={styles.wrap}>
				<FormStatus
					className={styles.status}
					mode={"error"}
					title={"Access denied"}
				>
					You do not have permission to open this section. Use the navigation menu to open an available module.
				</FormStatus>
			</div>
		</Container>
	);
};

export default ForbiddenPage;
