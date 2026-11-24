import React from 'react';

interface MuseumLogoProps {
  className?: string;
}

/**
 * Geometric warp-and-weft lattice mark inspired by Pringgasela traditional tenun structure.
 * Matches the 3x3 interlocking terracotta thread emblem of the museum header & footer.
 */
export const MuseumLogo: React.FC<MuseumLogoProps> = ({ className = 'w-9 h-9' }) => {
  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Vertical warp threads */}
      <rect x="11.5" y="4" width="2.4" height="32" rx="0.4" fill="currentColor" />
      <rect x="18.8" y="4" width="2.4" height="32" rx="0.4" fill="currentColor" />
      <rect x="26.1" y="4" width="2.4" height="32" rx="0.4" fill="currentColor" />

      {/* Horizontal weft threads with subtle woven break lines */}
      <rect x="4" y="11.5" width="32" height="2.4" rx="0.4" fill="currentColor" />
      <rect x="4" y="18.8" width="32" height="2.4" rx="0.4" fill="currentColor" />
      <rect x="4" y="26.1" width="32" height="2.4" rx="0.4" fill="currentColor" />

      {/* Subtle over-under weave depth notches */}
      <rect x="11.5" y="10.9" width="2.4" height="0.6" fill="#F3EEE5" fillOpacity="0.65" />
      <rect x="18.8" y="18.2" width="2.4" height="0.6" fill="#F3EEE5" fillOpacity="0.65" />
      <rect x="26.1" y="25.5" width="2.4" height="0.6" fill="#F3EEE5" fillOpacity="0.65" />
      <rect x="25.5" y="11.5" width="0.6" height="2.4" fill="#F3EEE5" fillOpacity="0.65" />
      <rect x="10.9" y="26.1" width="0.6" height="2.4" fill="#F3EEE5" fillOpacity="0.65" />
    </svg>
  );
};
