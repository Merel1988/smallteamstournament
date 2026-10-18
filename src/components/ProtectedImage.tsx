"use client";

import Image, { type ImageProps } from "next/image";

// Discourages saving: blocks right-click, dragging and the iOS long-press menu,
// and puts a transparent layer over the image so "open image" hits the overlay.
export default function ProtectedImage({
  wrapperClassName = "",
  alt,
  ...props
}: ImageProps & { wrapperClassName?: string }) {
  return (
    <span
      className={`relative block select-none ${wrapperClassName}`}
      style={{ WebkitTouchCallout: "none" }}
      onContextMenu={(e) => e.preventDefault()}
      onDragStart={(e) => e.preventDefault()}
    >
      <Image alt={alt} draggable={false} {...props} />
      <span className="absolute inset-0" aria-hidden />
    </span>
  );
}
