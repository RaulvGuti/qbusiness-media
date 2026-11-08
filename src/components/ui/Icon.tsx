import type { ReactNode } from "react";

const S = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

const ICONOS: Record<string, ReactNode> = {
  star: (
    <path
      d="M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.9L12 17.8 5.8 21.1 7 14.2 2 9.3l6.9-1L12 2z"
      fill="currentColor"
    />
  ),
  check: <path d="M5 12.5l4.5 4.5L19 7.5" {...S} />,
  "check-circle": (
    <>
      <circle cx="12" cy="12" r="9.5" {...S} />
      <path d="M8 12.5l2.7 2.7L16 9.8" {...S} />
    </>
  ),
  xmark: <path d="M6 6l12 12M18 6L6 18" {...S} />,
  "location-dot": (
    <>
      <path d="M12 22s7-6.2 7-12a7 7 0 10-14 0c0 5.8 7 12 7 12z" {...S} />
      <circle cx="12" cy="10" r="2.5" {...S} />
    </>
  ),
  "info-circle": (
    <>
      <circle cx="12" cy="12" r="9.5" {...S} />
      <path d="M12 11v5M12 8h.01" {...S} />
    </>
  ),
  envelope: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" {...S} />
      <path d="M3 7l9 6 9-6" {...S} />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9.5" {...S} />
      <path d="M12 7v5l3 2" {...S} />
    </>
  ),
  bars: <path d="M4 6h16M4 12h16M4 18h16" {...S} />,
  play: <path d="M8 5v14l11-7z" fill="currentColor" />,
  whatsapp: <path d="M12 3a9 9 0 00-7.7 13.6L3 21l4.6-1.2A9 9 0 1012 3zM9 8c.5 3 2.5 5.5 6 6.5" {...S} />,
  instagram: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="5" {...S} />
      <circle cx="12" cy="12" r="4" {...S} />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" />
    </>
  ),
  youtube: (
    <>
      <rect x="2" y="6" width="20" height="12" rx="4" {...S} />
      <path d="M10 9.5v5l4.5-2.5z" fill="currentColor" />
    </>
  ),
  tiktok: <path d="M14 3v11.5a3.5 3.5 0 11-3.5-3.5M14 3c.4 2.4 2 4 4.5 4.2" {...S} />,
  video: (
    <>
      <rect x="2" y="6" width="14" height="12" rx="2" {...S} />
      <path d="M16 10l6-3v10l-6-3z" {...S} />
    </>
  ),
  camera: (
    <>
      <path d="M4 8h3l2-3h6l2 3h3v11H4z" {...S} />
      <circle cx="12" cy="13" r="3.5" {...S} />
    </>
  ),
  microphone: (
    <>
      <rect x="9" y="3" width="6" height="11" rx="3" {...S} />
      <path d="M5 11a7 7 0 0014 0M12 18v3" {...S} />
    </>
  ),
  calendar: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2" {...S} />
      <path d="M3 10h18M8 3v4M16 3v4" {...S} />
    </>
  ),
  "arrow-right": <path d="M5 12h14M13 6l6 6-6 6" {...S} />,
  "arrow-left": <path d="M19 12H5M11 6l-6 6 6 6" {...S} />,
  "paper-plane": <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" {...S} />,
  lock: (
    <>
      <rect x="5" y="11" width="14" height="10" rx="2" {...S} />
      <path d="M8 11V8a4 4 0 118 0v3" {...S} />
    </>
  ),
};

const ALIAS: Record<string, string> = {
  "circle-info": "info-circle",
  "map-pin": "location-dot",
  "map-marked-alt": "location-dot",
  "play-circle": "play",
  podcast: "microphone",
  film: "video",
  "camera-retro": "camera",
  "calendar-check": "calendar",
  "calendar-times": "calendar",
};

type Props = { name: string; className?: string };

export function Icon({ name, className }: Props) {
  const forma = ICONOS[ALIAS[name] ?? name] ?? <circle cx="12" cy="12" r="3" fill="currentColor" />;
  return (
    <svg
      viewBox="0 0 24 24"
      width="1em"
      height="1em"
      aria-hidden="true"
      className={`inline-block align-[-0.125em] ${className ?? ""}`}
    >
      {forma}
    </svg>
  );
}
