'use client';

import { useTransition } from 'react';
import { useLocale } from 'next-intl';
import { locales, localeNames, localeFlags, type Locale } from '@/i18n/config';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Globe } from 'lucide-react';

export function LanguageSelector() {
    const locale = useLocale();
    const [isPending, startTransition] = useTransition();

    const handleLocaleChange = (newLocale: Locale) => {
        startTransition(() => {
            // Set cookie
            document.cookie = `locale=${newLocale};path=/;max-age=31536000`;
            // Reload page to apply new locale
            window.location.reload();
        });
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="sm"
                    className="gap-2"
                    disabled={isPending}
                >
                    <Globe className="h-4 w-4" />
                    <span className="hidden sm:inline">
                        {localeFlags[locale as Locale]} {localeNames[locale as Locale]}
                    </span>
                    <span className="sm:hidden">
                        {localeFlags[locale as Locale]}
                    </span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                {locales.map((loc) => (
                    <DropdownMenuItem
                        key={loc}
                        onClick={() => handleLocaleChange(loc)}
                        className={locale === loc ? 'bg-muted' : ''}
                    >
                        <span className="mr-2">{localeFlags[loc]}</span>
                        {localeNames[loc]}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
