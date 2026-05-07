import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const AUTH_COOKIE_NAME = process.env.AUTH_COOKIE_NAME ?? "autofabrication_token";
const AUTH_ROUTE = "/auth";
const FORBIDDEN_ROUTE = "/forbidden";
const NOT_FOUND_ROUTE = "/_not-found";
const API_BASE_URL = process.env.API_INTERNAL_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:4000/api/";

const withTrailingSlash = (value: string) => value.endsWith("/") ? value : `${value}/`;

const buildAccessCheckUrl = (pathname: string) => {
	const url = new URL("auth/access", withTrailingSlash(API_BASE_URL));
	url.searchParams.set("path", pathname);

	return url;
};

const clearAuthCookie = (response: NextResponse, request: NextRequest) => {
	response.cookies.set(AUTH_COOKIE_NAME, "", {
		httpOnly: true,
		sameSite: "lax",
		secure: request.nextUrl.protocol === "https:",
		path: "/",
		expires: new Date(0),
	});
};

const rewriteToAuth = (request: NextRequest, clearCookie = false) => {
	const response = NextResponse.rewrite(new URL(AUTH_ROUTE, request.url));

	if (clearCookie) {
		clearAuthCookie(response, request);
	}

	return response;
};

const allowAuthPage = (request: NextRequest, clearCookie = false) => {
	const response = NextResponse.next();

	if (clearCookie) {
		clearAuthCookie(response, request);
	}

	return response;
};

const rewriteToForbidden = (request: NextRequest) =>
	NextResponse.rewrite(new URL(FORBIDDEN_ROUTE, request.url));

const rewriteToNotFound = (request: NextRequest) =>
	NextResponse.rewrite(new URL(NOT_FOUND_ROUTE, request.url));

const loadAccess = async (request: NextRequest) => {
	return await fetch(buildAccessCheckUrl(request.nextUrl.pathname), {
		headers: {
			cookie: request.headers.get("cookie") ?? "",
		},
		cache: "no-store",
	});
};

export const proxy = async (request: NextRequest) => {
	const { pathname } = request.nextUrl;
	const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;

	if (!token) {
		return pathname === AUTH_ROUTE ? NextResponse.next() : rewriteToAuth(request);
	}

	try {
		const accessResponse = await loadAccess(request);

		if (accessResponse.status === 401 || accessResponse.status === 404) {
			return pathname === AUTH_ROUTE
				? allowAuthPage(request, true)
				: rewriteToAuth(request, true);
		}

		if (!accessResponse.ok) {
			return NextResponse.next();
		}

		const access = await accessResponse.json();

		if (pathname === AUTH_ROUTE) {
			return rewriteToNotFound(request);
		}

		if (access.isProtectedRoute && !access.allowed) {
			return rewriteToForbidden(request);
		}

		return NextResponse.next();
	} catch {
		return NextResponse.next();
	}
};

export const config = {
	matcher: ["/((?!api|storage|_next/static|_next/image|favicon.ico).*)"],
};
