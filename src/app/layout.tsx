import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import CapacitorProvider from "@/components/capacitor/CapacitorProvider";
import { OfflineToast } from "@/components/capacitor/OfflineToast";
import { AuthProvider } from "@/contexts/AuthContext";
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Don Juan GIS",
  description: "Plataforma agricola con GIS, operacion e inteligencia para productores",
  icons: {
    icon: "/favicon.ico",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <CapacitorProvider>
          <NextIntlClientProvider messages={messages}>
            <AuthProvider>
              {children}
              <OfflineToast />
            </AuthProvider>
          </NextIntlClientProvider>
        </CapacitorProvider>
      </body>
    </html>
  );
}
