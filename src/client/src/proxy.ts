import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const AUTH_COOKIE_NAME = "autofabrication_token";
const PUBLIC_PATHS = ["/auth"];

const isPublicPath = (pathname: string) => PUBLIC_PATHS.some((path) => pathname.startsWith(path));

export const proxy = (request: NextRequest) => {
	const { pathname } = request.nextUrl;
	const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;

	if (!token && !isPublicPath(pathname)) {
		return NextResponse.redirect(new URL("/auth", request.url));
	}

	if (token && pathname === "/auth") {
		return NextResponse.redirect(new URL("/", request.url));
	}

	return NextResponse.next();
};

export const config = {
	matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
