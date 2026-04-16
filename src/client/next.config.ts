import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	reactStrictMode: false,
	experimental: {
		webpackMemoryOptimizations: true,
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
