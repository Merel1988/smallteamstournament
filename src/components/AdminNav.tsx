import Link from "next/link";

const items = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/teams", label: "Teams" },
  { href: "/admin/spelers", label: "Spelers" },
  { href: "/admin/schema", label: "Schema" },
  { href: "/admin/bingo", label: "Bingo" },
  { href: "/admin/regels", label: "Regels" },
  { href: "/admin/fotos", label: "Foto's" },
  { href: "/admin/mvp", label: "MVP" },
  { href: "/admin/push", label: "Push" },
  { href: "/admin/qr", label: "QR" },
];

export default function AdminNav() {
  return (
    <nav className="bg-white rounded-xl p-2 shadow mb-6 flex flex-wrap gap-1">
      {items.map((it) => (
        <Link
          key={it.href}
          href={it.href}
          className="px-3 py-1 text-sm rounded-full hover:bg-derby-yellow transition"
        >
          {it.label}
        </Link>
      ))}
      <form method="POST" action="/api/admin/logout" className="ml-auto">
        <button
          type="submit"
          className="px-3 py-1 text-sm rounded-full bg-derby-ink text-derby-yellow"
        >
          Uitloggen
        </button>
      </form>
    </nav>
  );
}
