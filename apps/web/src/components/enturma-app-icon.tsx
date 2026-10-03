"use client";

import Image from "next/image";

export function EnturmaAppIcon({
  size = 22,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <Image
      src="/enturma-app-icon.png"
      width={size}
      height={size}
      alt=""
      aria-hidden="true"
      className={className}
      sizes={`${size}px`}
      unoptimized
    />
  );
}
