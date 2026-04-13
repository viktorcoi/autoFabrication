import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	reactStrictMode: true,
	sassOptions: {
		silenceDeprecations: ["legacy-js-api"],
	},
};

export default nextConfig;
