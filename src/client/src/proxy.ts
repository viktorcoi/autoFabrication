import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const AUTH_COOKIE_NAME = "autofabrication_token";

export const proxy = (request: NextRequest) => {
    const { pathname } = request.nextUrl;
    const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;

    if (!token) {
        return NextResponse.rewrite(new URL("/auth", request.url));
    }

    if (token && pathname === "/auth") {
        return NextResponse.rewrite(new URL("/_not-found", request.url));
    }

    return NextResponse.next();
};

export const config = {
    matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
