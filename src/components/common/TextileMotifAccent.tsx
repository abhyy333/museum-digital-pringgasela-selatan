import React from 'react';

interface TextileMotifProps {
  className?: string;
}

/**
 * Low-opacity geometric Sasak diamond/warp-and-weft background band (3-8% opacity).
 * Designed cleanly for editorial museum headers, sidebar crowns, and subtle section dividers.
 */
export const TextileMotifBand: React.FC<TextileMotifProps> = ({ className = '' }) => {
  return (
    <svg
      aria-hidden="true"
      className={`pointer-events-none select-none text-indigoTextile opacity-[0.05] ${className}`}
      width="100%"
      height="100%"
    >
      <defs>
        <pattern
          id="sasak-subahnale-weave"
          width="36"
          height="36"
          patternUnits="userSpaceOnUse"
        >
          {/* Outer rhombus diamond */}
          <path
            d="M18 3 L33 18 L18 33 L3 18 Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
          />
          {/* Inner seed square */}
          <path
            d="M18 11 L25 18 L18 25 L11 18 Z"
            fill="none"
            stroke="#984323"
            strokeWidth="0.9"
          />
          {/* Center warp/weft knot */}
          <circle cx="18" cy="18" r="1.4" fill="currentColor" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#sasak-subahnale-weave)" />
    </svg>
  );
};

/**
 * Subtle horizontal woven border separator linking editorial sections cleanly.
 */
export const TextileDivider: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`flex items-center gap-3 select-none ${className}`} aria-hidden="true">
      <div className="h-px flex-1 bg-softLinen" />
      <svg width="28" height="10" viewBox="0 0 28 10" fill="none" className="text-mutedBrown/55">
        <path d="M5 5 L9 1 L13 5 L9 9 Z" stroke="currentColor" strokeWidth="1" />
        <path d="M15 5 L19 1 L23 5 L19 9 Z" stroke="#984323" strokeWidth="1" />
        <circle cx="14" cy="5" r="1.1" fill="currentColor" />
      </svg>
      <div className="h-px flex-1 bg-softLinen" />
    </div>
  );
};
