import type { Metadata, Viewport } from "next";
import Link from "next/link";
import "./globals.css";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";
import RollerSkateLogo from "@/components/RollerSkateLogo";

export const metadata: Metadata = {
  title: "Small Teams Tournament — Roadkill Rollers Nijmegen",
  description:
    "Alles over het Small Teams Tournament van Roadkill Rollers Nijmegen op 21 november 2026 — teams, schema, bingo, foto's en meer.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Derby STT",
  },
};

export const viewport: Viewport = {
  themeColor: "#e30613",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

const navItems = [
  { href: "/", label: "Home" },
  { href: "/teams", label: "Teams" },
  { href: "/schema", label: "Schema" },
  { href: "/bingo", label: "Bingo" },
  { href: "/fotos", label: "Foto's" },
  { href: "/mvp", label: "MVP" },
  { href: "/regels", label: "Regels" },
  { href: "/venue", label: "Venue" },
  { href: "/nickname", label: "Derby-naam" },
];

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="nl">
      <body className="min-h-screen flex flex-col">
        <header className="bg-derby-ink text-white sticky top-0 z-40 shadow-lg">
          <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
            <Link href="/" className="flex items-center gap-2">
              <RollerSkateLogo className="w-12 h-9" />
              <span className="font-display text-2xl text-derby-yellow leading-none">
                Small Teams Tournament
              </span>
            </Link>
            <Link
              href="/notificaties"
              className="text-xs text-derby-yellow underline underline-offset-2"
            >
              Notificaties
            </Link>
          </div>
          <nav className="max-w-6xl mx-auto px-2 pb-2 flex gap-1 overflow-x-auto">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="whitespace-nowrap rounded-full px-3 py-1 text-sm hover:bg-derby-accent hover:text-white transition"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </header>

        <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-6">
          {children}
        </main>

        <footer className="bg-derby-ink text-white/70 text-xs py-4 text-center">
          <p>
            Small Teams Tournament · Roadkill Rollers Nijmegen · 21 nov 2026 ·
            Sportzaal De Horstacker
          </p>
          <Link
            href="/admin/login"
            className="text-white/40 hover:text-white/70 underline"
          >
            Admin
          </Link>
        </footer>

        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
