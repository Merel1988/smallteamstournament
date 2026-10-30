"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AutoRefresh({ intervalMs }: { intervalMs: number }) {
  const router = useRouter();
  useEffect(() => {
    const id = setInterval(() => {
      if (document.visibilityState === "visible") router.refresh();
    }, intervalMs);
    return () => clearInterval(id);
  }, [intervalMs, router]);
  return null;
}
