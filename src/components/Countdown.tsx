"use client";

import { useEffect, useState } from "react";

type Parts = { days: number; hours: number; minutes: number; seconds: number };

function diff(target: Date): Parts {
  const ms = Math.max(0, target.getTime() - Date.now());
  const days = Math.floor(ms / (1000 * 60 * 60 * 24));
  const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((ms / (1000 * 60)) % 60);
  const seconds = Math.floor((ms / 1000) % 60);
  return { days, hours, minutes, seconds };
}

export default function Countdown({ target }: { target: Date }) {
  const [parts, setParts] = useState<Parts>(() => diff(target));

  useEffect(() => {
    const id = setInterval(() => setParts(diff(target)), 1000);
    return () => clearInterval(id);
  }, [target]);

  const cells: { value: number; label: string }[] = [
    { value: parts.days, label: "dagen" },
    { value: parts.hours, label: "uur" },
    { value: parts.minutes, label: "min" },
    { value: parts.seconds, label: "sec" },
  ];

  return (
    <div className="grid grid-cols-4 gap-2 sm:gap-4">
      {cells.map((c) => (
        <div
          key={c.label}
          className="bg-derby-ink text-derby-yellow rounded-xl py-4 px-2 text-center shadow-md"
        >
          <div className="font-display text-4xl sm:text-5xl leading-none">
            {String(c.value).padStart(2, "0")}
          </div>
          <div className="text-xs uppercase tracking-wider mt-1 text-white/80">
            {c.label}
          </div>
        </div>
      ))}
    </div>
  );
}
