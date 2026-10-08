export function Logo({ size = 40 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      role="img"
      aria-label="CoopFix"
    >
      <rect width="48" height="48" rx="14" fill="#9B1B30" />
      <path
        d="M11 25.5 24 14.5l13 11"
        stroke="#FBE8A6"
        strokeWidth="3.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M15.5 25.5V34a2 2 0 0 0 2 2h13a2 2 0 0 0 2-2v-8.5"
        stroke="#FBE8A6"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <rect x="21.6" y="27.5" width="4.8" height="8.5" rx="1.8" fill="#FBE8A6" />
      <g transform="translate(24 -2)">
        <path
          d="M9.3 8.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94L9.98 7.3z"
          fill="#FBE8A6"
        />
      </g>
    </svg>
  );
}
