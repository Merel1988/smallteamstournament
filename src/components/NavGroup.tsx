"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Link, usePathname } from "@/i18n/navigation";
import type { NavLink } from "@/lib/nav";

export default function NavGroup({
  label,
  items,
}: {
  label: string;
  items: NavLink[];
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();
  const active = items.some((item) => item.href === pathname);

  const [lastPathname, setLastPathname] = useState(pathname);
  if (pathname !== lastPathname) {
    setLastPathname(pathname);
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    const onPointer = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, [open]);

  return (
    <div
      ref={rootRef}
      className="relative"
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setOpen(false);
      }}
    >
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((o) => !o)}
        className={`whitespace-nowrap rounded-full px-3 py-1 text-sm hover:bg-derby-accent hover:text-white transition ${
          active ? "bg-white/10" : ""
        }`}
      >
        {label}{" "}
        <span aria-hidden="true" className={`inline-block transition ${open ? "rotate-180" : ""}`}>
          ▾
        </span>
      </button>
      <ul
        id={menuId}
        hidden={!open}
        className="absolute left-0 top-full mt-1 min-w-44 rounded-xl bg-derby-ink border border-white/10 shadow-lg p-1 z-50"
      >
        {items.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              aria-current={item.href === pathname ? "page" : undefined}
              onClick={() => setOpen(false)}
              className="block whitespace-nowrap rounded-lg px-3 py-2 text-sm hover:bg-derby-accent hover:text-white"
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
