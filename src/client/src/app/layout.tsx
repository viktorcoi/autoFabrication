import '@vkontakte/vkui/dist/vkui.css';
import "./globals.scss";
import { PropsWithChildren } from "react";
import Wrapper from "@/app/wrapper";

const LayoutRoot = ({ children }: PropsWithChildren) => {

	return (
		<html
			lang="ru"
			className="vkui"
		>
			<head>
				<style
					data-element-for-preload="true"
					dangerouslySetInnerHTML={{ __html: "body{opacity:0}" }}
				/>
				<noscript
					data-element-for-preload="true"
					dangerouslySetInnerHTML={{ __html: "<style>body{opacity:1}</style>" }}
				/>
				<title>Да хуй знает, пока не думал над этим</title>
				<meta
					name="viewport"
					content="width=device-width, initial-scale=1, shrink-to-fit=no, user-scalable=no, viewport-fit=cover"
				/>
				<link id="favicon" rel="icon" type="image/x-icon" href="/favicon.ico" sizes="16x16"/>
			</head>
			<body className="vkui__root">
				<Wrapper>
					{children}
				</Wrapper>
			</body>
		</html>
	);
};

export default LayoutRoot;
