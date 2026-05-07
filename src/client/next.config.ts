import type { NextConfig } from "next";

const apiProxyBaseUrl = process.env.API_INTERNAL_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:4000/api/";
const storageProxyBaseUrl = apiProxyBaseUrl.replace(/\/api\/?$/, "");

const nextConfig: NextConfig = {
	reactStrictMode: false,
	experimental: {
		proxyClientMaxBodySize: "300mb",
		webpackMemoryOptimizations: true,
	},
	async rewrites() {
		return [
			{
				source: "/api/:path*",
				destination: `${apiProxyBaseUrl.replace(/\/$/, "")}/:path*`,
			},
			{
				source: "/storage/:path*",
				destination: `${storageProxyBaseUrl.replace(/\/$/, "")}/storage/:path*`,
			},
		];
	},
	onDemandEntries: {
		maxInactiveAge: 15 * 1000,
		pagesBufferLength: 2,
	},
	sassOptions: {
		silenceDeprecations: ["legacy-js-api"],
	},
};

export default nextConfig;
