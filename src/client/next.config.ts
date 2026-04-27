import type { NextConfig } from "next";

const apiProxyBaseUrl = process.env.API_INTERNAL_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:4000/api/";

const nextConfig: NextConfig = {
	reactStrictMode: false,
	experimental: {
		webpackMemoryOptimizations: true,
	},
	async rewrites() {
		return [
			{
				source: "/api/:path*",
				destination: `${apiProxyBaseUrl.replace(/\/$/, "")}/:path*`,
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
