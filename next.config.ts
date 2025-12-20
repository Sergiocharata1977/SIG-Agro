import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n.ts');

const nextConfig: NextConfig = {
    /* config options here */
    typescript: {
        //  This allows production builds to successfully complete even if
        // your project has type errors.
        ignoreBuildErrors: true,
    }
};

export default withNextIntl(nextConfig);
