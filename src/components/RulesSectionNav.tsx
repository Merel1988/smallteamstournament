"use client";

import { useEffect, useRef, useState } from "react";

type Item = { id: string; label: string };

/**
 * Sticky, centred in-page menu for /regels. Sticks right below the (sticky) site
 * header, whose height varies with the viewport, so it is measured. The section
 * currently in view is highlighted.
 */
export function RulesSectionNav({
  items,
  label,
}: {
  items: Item[];
  label: string;
}) {
  const [top, setTop] = useState(0);
  const [active, setActive] = useState<string | null>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // On narrow screens the menu scrolls sideways: keep the active item in view.
  useEffect(() => {
    const list = listRef.current;
    const link = list?.querySelector<HTMLElement>('[aria-current="true"]');
    if (!list || !link) return;
    list.scrollTo({
      left: link.offsetLeft - (list.clientWidth - link.offsetWidth) / 2,
      behavior: "smooth",
    });
  }, [active]);

  useEffect(() => {
    const header = document.querySelector("body > header, header");
    if (!header) return;
    const update = () => {
      const h = header.getBoundingClientRect().height;
      setTop(h);
      document.documentElement.style.setProperty("--rules-sticky-top", `${h}px`);
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(header);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const sections = items
      .map((i) => document.getElementById(i.id))
      .filter((el): el is HTMLElement => el !== null);
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-30% 0px -60% 0px" },
    );
    sections.forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, [items]);

  return (
    <nav
      aria-label={label}
      style={{ top: top + 8 }}
      className="sticky z-30 flex justify-center"
    >
      <ul
        ref={listRef}
        className="relative flex max-w-full gap-1 overflow-x-auto rounded-full border border-derby-ink/10 bg-white/95 p-1 shadow-lg backdrop-blur">
        {items.map((item) => (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              aria-current={active === item.id ? "true" : undefined}
              className={`block whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-bold transition ${
                active === item.id
                  ? "bg-derby-accent text-white"
                  : "hover:bg-derby-accent/10"
              }`}
            >
              {item.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
