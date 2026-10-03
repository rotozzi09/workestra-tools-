import React from "react";

/** Colorful, high-detail vector Piano icon with zero background container */
export function PianoColorIcon({ active, className = "size-7" }: { active: boolean; className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`${className} transition-all ${
        active
          ? "drop-shadow-[0_2px_8px_rgba(220,38,38,0.45)] scale-110"
          : "opacity-50 saturate-60 hover:opacity-90 hover:saturate-100 hover:scale-105"
      }`}
    >
      {/* Red felt strip at top of keys (classic piano felt) */}
      <rect x="2" y="5" width="28" height="2.5" rx="1" fill="#DC2626" />
      {/* White keys body */}
      <rect
        x="2"
        y="7.5"
        width="28"
        height="19.5"
        rx="1.5"
        fill="#F8FAFC"
        stroke="#94A3B8"
        strokeWidth="0.75"
      />
      {/* Key divider lines */}
      <line x1="6" y1="7.5" x2="6" y2="26.5" stroke="#CBD5E1" strokeWidth="0.75" />
      <line x1="10" y1="7.5" x2="10" y2="26.5" stroke="#CBD5E1" strokeWidth="0.75" />
      <line x1="14" y1="7.5" x2="14" y2="26.5" stroke="#CBD5E1" strokeWidth="0.75" />
      <line x1="18" y1="7.5" x2="18" y2="26.5" stroke="#CBD5E1" strokeWidth="0.75" />
      <line x1="22" y1="7.5" x2="22" y2="26.5" stroke="#CBD5E1" strokeWidth="0.75" />
      <line x1="26" y1="7.5" x2="26" y2="26.5" stroke="#CBD5E1" strokeWidth="0.75" />
      {/* Black keys */}
      <rect x="4.5" y="7.5" width="3" height="11" rx="0.75" fill="#0F172A" />
      <rect x="8.5" y="7.5" width="3" height="11" rx="0.75" fill="#0F172A" />
      <rect x="16.5" y="7.5" width="3" height="11" rx="0.75" fill="#0F172A" />
      <rect x="20.5" y="7.5" width="3" height="11" rx="0.75" fill="#0F172A" />
      <rect x="24.5" y="7.5" width="3" height="11" rx="0.75" fill="#0F172A" />
      {/* Subtle glossy highlights on black keys */}
      <rect x="5.2" y="8" width="1.6" height="4" rx="0.5" fill="#475569" opacity="0.7" />
      <rect x="9.2" y="8" width="1.6" height="4" rx="0.5" fill="#475569" opacity="0.7" />
      <rect x="17.2" y="8" width="1.6" height="4" rx="0.5" fill="#475569" opacity="0.7" />
      <rect x="21.2" y="8" width="1.6" height="4" rx="0.5" fill="#475569" opacity="0.7" />
      <rect x="25.2" y="8" width="1.6" height="4" rx="0.5" fill="#475569" opacity="0.7" />
    </svg>
  );
}

/** Colorful, warm amber wood Acoustic Guitar icon with zero background container */
export function GuitarColorIcon({ active, className = "size-7" }: { active: boolean; className?: string }) {
  const gradId = React.useId();
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`${className} transition-all ${
        active
          ? "drop-shadow-[0_2px_8px_rgba(245,158,11,0.55)] scale-110"
          : "opacity-50 saturate-60 hover:opacity-90 hover:saturate-100 hover:scale-105"
      }`}
    >
      {/* Guitar neck */}
      <rect x="14.2" y="2" width="3.6" height="13" rx="0.5" fill="#B45309" />
      {/* Frets */}
      <line x1="14.2" y1="5" x2="17.8" y2="5" stroke="#FDE68A" strokeWidth="0.6" />
      <line x1="14.2" y1="8" x2="17.8" y2="8" stroke="#FDE68A" strokeWidth="0.6" />
      <line x1="14.2" y1="11" x2="17.8" y2="11" stroke="#FDE68A" strokeWidth="0.6" />
      {/* Headstock */}
      <path d="M13.8 2C13.8 1 14.3 0.5 16 0.5C17.7 0.5 18.2 1 18.2 2L17.8 4H14.2L13.8 2Z" fill="#92400E" />
      {/* Tuning pegs */}
      <circle cx="12.5" cy="1.6" r="0.9" fill="#F59E0B" />
      <circle cx="12.5" cy="3.2" r="0.9" fill="#F59E0B" />
      <circle cx="19.5" cy="1.6" r="0.9" fill="#F59E0B" />
      <circle cx="19.5" cy="3.2" r="0.9" fill="#F59E0B" />
      {/* Acoustic guitar body with hourglass waist */}
      <path
        d="M13 13C10.5 13 8.5 14.5 8.5 17C8.5 19 9.8 20.2 11 21C9.2 22.2 7 24 7 27C7 30 10.5 31.5 16 31.5C21.5 31.5 25 30 25 27C25 24 22.8 22.2 21 21C22.2 20.2 23.5 19 23.5 17C23.5 14.5 21.5 13 19 13H13Z"
        fill={`url(#${gradId})`}
        stroke="#92400E"
        strokeWidth="0.8"
      />
      {/* Rosette & Soundhole */}
      <circle cx="16" cy="18.5" r="3.2" fill="#78350F" />
      <circle cx="16" cy="18.5" r="2.8" stroke="#FDE68A" strokeWidth="0.6" />
      <circle cx="16" cy="18.5" r="2.2" fill="#0F172A" />
      {/* Bridge */}
      <rect x="13" y="26" width="6" height="2" rx="0.6" fill="#78350F" />
      <rect x="14" y="26.3" width="4" height="0.6" rx="0.3" fill="#F1F5F9" />
      {/* Strings */}
      <line x1="14.6" y1="2" x2="14.6" y2="26" stroke="#FEF08A" strokeWidth="0.5" opacity="0.9" />
      <line x1="15.5" y1="2" x2="15.5" y2="26" stroke="#FFFFFF" strokeWidth="0.5" opacity="0.95" />
      <line x1="16.5" y1="2" x2="16.5" y2="26" stroke="#FFFFFF" strokeWidth="0.5" opacity="0.95" />
      <line x1="17.4" y1="2" x2="17.4" y2="26" stroke="#FEF08A" strokeWidth="0.5" opacity="0.9" />
      <defs>
        <radialGradient id={gradId} cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(16 23) rotate(90) scale(8.5 7.5)">
          <stop stopColor="#F59E0B" />
          <stop offset="0.65" stopColor="#D97706" />
          <stop offset="1" stopColor="#92400E" />
        </radialGradient>
      </defs>
    </svg>
  );
}

/** Detailed Silver & Black Trigger Capo vector icon (matching user's illustration) */
export function CapoIcon({ className = "size-6" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Top Arm - Silver Metallic Bar extending upper-left */}
      <path
        d="M 6.5 4 L 19 8.2 C 23.5 9.8 25 11.5 25 14 L 23 23 C 22 28 20 30.5 17.5 31 C 16.8 31 16.5 29.8 17 28 C 18.3 25.5 19.5 22.5 19.8 17.5"
        fill="#CBD5E1"
        stroke="#475569"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Glossy top metallic highlight */}
      <path
        d="M 7 4.8 L 18.5 8.6 C 22 10 23.8 11.2 24.2 13.2"
        stroke="#F8FAFC"
        strokeWidth="0.9"
        strokeLinecap="round"
      />

      {/* Top Arm Black Rubber Pad (Underneath top clamping bar) */}
      <path
        d="M 7.2 5.5 L 17.5 9.2 C 18.3 9.5 18 10.8 17 10.6 L 8 7.5 C 7 7.2 6.6 5.8 7.2 5.5 Z"
        fill="#0F172A"
      />

      {/* Middle Neck Clamp Arm with Black Rubber Pad */}
      <path
        d="M 8.8 12.2 C 10.5 12.8 15.5 14.8 16.6 16.8 C 17.2 17.8 16.2 18.6 15 18 C 12.5 16.8 9.5 15.2 8.5 13.5 C 8 12.8 8.2 12 8.8 12.2 Z"
        fill="#1E293B"
        stroke="#020617"
        strokeWidth="0.6"
      />

      {/* Front Handle Lever (Silver Curved Arm extending down-left) */}
      <path
        d="M 13.8 16.8 C 11.5 17.5 9.8 20.2 9.2 25 C 8.8 26.6 10 26.8 10.8 25.5 C 12.2 22.2 13.8 19.2 16.2 18 C 15.2 17.5 14.3 17 13.8 16.8 Z"
        fill="#94A3B8"
        stroke="#475569"
        strokeWidth="1"
        strokeLinejoin="round"
      />

      {/* Back Handle Rubber Grip Pad (Black rubber handle bottom-right) */}
      <path
        d="M 21.5 23 C 20.8 25.8 19.5 29.8 17.5 31 C 16.8 31 16.5 29.8 17.1 28 C 18.3 25.5 19.3 23.2 20.5 22 C 21 22.2 21.3 22.6 21.5 23 Z"
        fill="#0F172A"
      />

      {/* Circular Pivot Hinge (Silver Disc with concentric ring) */}
      <circle cx="19.8" cy="13.8" r="3.8" fill="#E2E8F0" stroke="#334155" strokeWidth="1.2" />
      <circle cx="19.8" cy="13.8" r="2.5" fill="#CBD5E1" stroke="#475569" strokeWidth="0.8" />
    </svg>
  );
}
