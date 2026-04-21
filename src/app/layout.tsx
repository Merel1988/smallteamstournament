import "./globals.css";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";
import type { Viewport } from "next";

export const viewport: Viewport = {
  themeColor: "#e30613",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="nl">
      <body className="min-h-screen flex flex-col">
        {children}
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
