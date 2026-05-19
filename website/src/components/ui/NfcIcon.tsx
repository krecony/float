interface NfcIconProps {
  size?: number;
  color?: string;
  animated?: boolean;
  className?: string;
}

export function NfcIcon({
  size = 40,
  color = "#06b6d4",
  animated = false,
  className = "",
}: NfcIconProps) {
  const waveClass = animated ? "animate-pulse" : "";

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      className={`${className} ${waveClass}`}
      aria-hidden
    >
      <path
        d="M14 24c0-5.5 4.5-10 10-10"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        opacity={animated ? 0.9 : 0.7}
      />
      <path
        d="M10 24c0-7.7 6.3-14 14-14"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        opacity={animated ? 0.7 : 0.5}
      />
      <path
        d="M6 24c0-9.9 8.1-18 18-18"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        opacity={animated ? 0.5 : 0.35}
      />
      <circle cx="24" cy="24" r="2.5" fill={color} />
    </svg>
  );
}
