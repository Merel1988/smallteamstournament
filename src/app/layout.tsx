import "./globals.css";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";
import type { Viewport } from "next";
import { getLocale } from "next-intl/server";

export const viewport: Viewport = {
  themeColor: "#e30613",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Reflect the active locale on <html> for screen readers / correct hyphenation.
  // Admin routes live outside [locale] and resolve to the default locale (nl).
  const locale = await getLocale();
  return (
    <html lang={locale}>
      <body className="min-h-screen flex flex-col">
        {children}
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
