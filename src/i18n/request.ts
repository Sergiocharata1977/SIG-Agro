import { getRequestConfig } from 'next-intl/server';
import { cookies } from 'next/headers';

export const locales = ['es', 'en', 'pt'] as const;
export type Locale = (typeof locales)[number];

export const localeNames: Record<Locale, string> = {
    es: 'Español',
    en: 'English',
    pt: 'Português'
};

export const defaultLocale: Locale = 'es';

export default getRequestConfig(async () => {
    // Get locale from cookie or use default
    const cookieStore = await cookies();
    const localeCookie = cookieStore.get('locale')?.value;
    const locale = locales.includes(localeCookie as Locale)
        ? (localeCookie as Locale)
        : defaultLocale;

    return {
        locale,
        messages: (await import(`./messages/${locale}.json`)).default
    };
});
