"use client";

import dynamic from "next/dynamic";

// Client-only: the pending score queue is restored from localStorage on first render.
export default dynamic(() => import("@/components/LiveScorer"), { ssr: false });
