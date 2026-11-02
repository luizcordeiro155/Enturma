"use client";

export function EnturmaAppIcon({
  size = 22,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      viewBox="72 104 360 338"
      width={size}
      height={size}
      aria-hidden="true"
      focusable="false"
      className={`enturma-app-mark ${className ?? ""}`}
      fill="none"
    >
      <path
        d="M100 131h91c30 0 53 14 65 34 12-20 35-34 65-34h91v236h-91c-30 0-53 12-65 32-12-20-35-32-65-32h-91z"
        stroke="currentColor"
        strokeWidth="22"
        strokeLinejoin="round"
      />
      <path d="M256 167v229" stroke="currentColor" strokeWidth="20" />
      <circle cx="396" cy="410" r="27" fill="var(--success, #80b64d)" />
    </svg>
  );
}
