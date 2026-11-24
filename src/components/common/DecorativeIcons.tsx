import React from 'react';

// 1. Authentic Woven Thread Grid Logo (4x4 Interlaced Warp and Weft)
export const WovenGridLogo: React.FC<{ className?: string }> = ({ className = "w-8 h-8 text-terracotta" }) => (
  <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* 4 Vertical Warp Threads */}
    <rect x="7" y="3" width="3.5" height="34" rx="1.75" fill="currentColor" />
    <rect x="15" y="3" width="3.5" height="34" rx="1.75" fill="currentColor" />
    <rect x="23" y="3" width="3.5" height="34" rx="1.75" fill="currentColor" />
    <rect x="31" y="3" width="3.5" height="34" rx="1.75" fill="currentColor" />

    {/* 4 Horizontal Weft Threads Interlaced */}
    <rect x="3" y="7" width="34" height="3.5" rx="1.75" fill="currentColor" />
    <rect x="3" y="15" width="34" height="3.5" rx="1.75" fill="currentColor" />
    <rect x="3" y="23" width="34" height="3.5" rx="1.75" fill="currentColor" />
    <rect x="3" y="31" width="34" height="3.5" rx="1.75" fill="currentColor" />

    {/* Subtle depth dots at thread crossings */}
    <circle cx="8.75" cy="8.75" r="0.75" fill="#E8DCC9" opacity="0.4" />
    <circle cx="24.75" cy="16.75" r="0.75" fill="#E8DCC9" opacity="0.4" />
    <circle cx="16.75" cy="24.75" r="0.75" fill="#E8DCC9" opacity="0.4" />
    <circle cx="32.75" cy="32.75" r="0.75" fill="#E8DCC9" opacity="0.4" />
  </svg>
);

// 2. Sweeping Yarn Curves Flowing Across Background
export const SweepingYarnCurves: React.FC<{ className?: string }> = ({ className = "absolute inset-0 pointer-events-none" }) => (
  <svg viewBox="0 0 1200 600" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} preserveAspectRatio="none">
    <path
      d="M-100,500 C200,600 500,450 750,250 C950,90 1150,140 1300,100"
      stroke="#C66A42"
      strokeWidth="1.5"
      strokeOpacity="0.45"
      strokeDasharray="4 2"
    />
    <path
      d="M-50,480 C250,570 550,420 800,230 C1000,80 1180,120 1350,90"
      stroke="#B95735"
      strokeWidth="2"
      strokeOpacity="0.55"
    />
    <path
      d="M0,460 C300,540 600,390 850,210 C1050,70 1220,110 1400,80"
      stroke="#A95B3D"
      strokeWidth="1.2"
      strokeOpacity="0.35"
    />
    <path
      d="M50,440 C350,510 650,360 900,190 C1100,60 1260,100 1450,70"
      stroke="#E8DCC9"
      strokeWidth="1"
      strokeOpacity="0.25"
    />
  </svg>
);

// 3. Sasak Diamond Star Embroidery Cluster
export const SasakDiamondStar: React.FC<{ className?: string }> = ({ className = "w-6 h-6 text-heritage-beige" }) => (
  <svg viewBox="0 0 32 32" fill="currentColor" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Center Cross */}
    <rect x="14" y="8" width="4" height="16" rx="1" />
    <rect x="8" y="14" width="16" height="4" rx="1" />
    {/* Diamond Corner Nodes */}
    <rect x="14" y="2" width="4" height="4" rx="0.5" />
    <rect x="14" y="26" width="4" height="4" rx="0.5" />
    <rect x="2" y="14" width="4" height="4" rx="0.5" />
    <rect x="26" y="14" width="4" height="4" rx="0.5" />
    {/* Diagonal Stitch Accents */}
    <rect x="9" y="9" width="3" height="3" rx="0.5" opacity="0.75" />
    <rect x="20" y="9" width="3" height="3" rx="0.5" opacity="0.75" />
    <rect x="9" y="20" width="3" height="3" rx="0.5" opacity="0.75" />
    <rect x="20" y="20" width="3" height="3" rx="0.5" opacity="0.75" />
  </svg>
);

export const SasakStarCluster: React.FC<{ className?: string }> = ({ className = "" }) => (
  <div className={`grid grid-cols-2 gap-3 opacity-30 pointer-events-none select-none ${className}`}>
    <div className="flex flex-col gap-3">
      <SasakDiamondStar className="w-8 h-8 text-heritage-cream" />
      <SasakDiamondStar className="w-8 h-8 text-heritage-cream translate-x-4" />
      <SasakDiamondStar className="w-8 h-8 text-heritage-cream" />
    </div>
    <div className="flex flex-col gap-3 translate-y-4">
      <SasakDiamondStar className="w-8 h-8 text-heritage-cream" />
      <SasakDiamondStar className="w-8 h-8 text-heritage-cream translate-x-4" />
      <SasakDiamondStar className="w-8 h-8 text-heritage-cream" />
    </div>
  </div>
);

// 4. Subtle Terracotta Brush Stroke / Accent Bar
export const TerracottaBrushUnderline: React.FC<{ className?: string }> = ({ className = "h-1.5 w-48 text-terracotta" }) => (
  <svg viewBox="0 0 200 8" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path
      d="M2,5 C30,2 70,6 100,4 C140,2 180,5 198,3"
      stroke="#B95735"
      strokeWidth="4"
      strokeLinecap="round"
      strokeOpacity="0.85"
    />
  </svg>
);
