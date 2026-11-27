import React from 'react';

interface TextileMotifAccentProps {
  className?: string;
}

/**
 * Subtle SVG geometric diamond & warp-weft accent inspired by Sasak Subahnale weaving.
 * Intended strictly for 3-8% opacity editorial accents (headers, sidebars, empty states).
 */
export const TextileMotifAccent: React.FC<TextileMotifAccentProps> = ({
  className = 'w-28 h-28 text-terracotta opacity-[0.06] pointer-events-none select-none',
}) => {
  return (
    <svg
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <pattern id="pringgasela-subahnale-accent" width="40" height="40" patternUnits="userSpaceOnUse">
          <polygon points="20,4 36,20 20,36 4,20" stroke="currentColor" strokeWidth="1.2" />
          <polygon points="20,11 29,20 20,29 11,20" stroke="currentColor" strokeWidth="1" />
          <circle cx="20" cy="20" r="2" fill="currentColor" />
          <line x1="0" y1="20" x2="4" y2="20" stroke="currentColor" strokeWidth="0.9" />
          <line x1="36" y1="20" x2="40" y2="20" stroke="currentColor" strokeWidth="0.9" />
          <line x1="20" y1="0" x2="20" y2="4" stroke="currentColor" strokeWidth="0.9" />
          <line x1="20" y1="36" x2="20" y2="40" stroke="currentColor" strokeWidth="0.9" />
        </pattern>
      </defs>
      <rect width="120" height="120" fill="url(#pringgasela-subahnale-accent)" />
    </svg>
  );
};
