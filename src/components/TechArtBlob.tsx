import React from 'react';

interface TechArtBlobProps {
  size?: number | string;
  className?: string;
  mini?: boolean;
}

/**
 * High-fidelity 3D Abstract Organic Cyber Network Graphic
 * Perfectly reproduces the visual element from the ARVIN STUDIO UI reference image.
 */
export const TechArtBlob: React.FC<TechArtBlobProps> = ({
  size = 140,
  className = '',
  mini = false,
}) => {
  const uniqueId = React.useId().replace(/:/g, '');

  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 select-none pointer-events-none ${className}`}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 200 180"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-[0_8px_20px_rgba(37,99,235,0.28)]"
      >
        <defs>
          {/* Main Organic Blob Radial Gradient */}
          <radialGradient
            id={`blob-grad-${uniqueId}`}
            cx="45%"
            cy="40%"
            r="60%"
            fx="35%"
            fy="30%"
          >
            <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.95" />
            <stop offset="25%" stopColor="#2563EB" stopOpacity="0.95" />
            <stop offset="65%" stopColor="#1E3A8A" stopOpacity="0.98" />
            <stop offset="100%" stopColor="#0B132B" stopOpacity="1" />
          </radialGradient>

          {/* Secondary Fluid Wave Gradient */}
          <linearGradient
            id={`wave-grad-${uniqueId}`}
            x1="10%"
            y1="20%"
            x2="90%"
            y2="80%"
          >
            <stop offset="0%" stopColor="#06B6D4" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#3B82F6" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#1D4ED8" stopOpacity="0.1" />
          </linearGradient>

          {/* Cybernetic Grid Glow Filter */}
          <filter id={`glow-${uniqueId}`} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>

          {/* Node Glow Filter */}
          <filter id={`node-glow-${uniqueId}`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Ambient Outer Aura */}
        <path
          d="M 50 70 C 40 40, 80 15, 120 25 C 160 35, 185 60, 180 100 C 175 140, 130 165, 90 155 C 50 145, 30 110, 50 70 Z"
          fill="url(#blob-grad)"
          className="opacity-40 blur-md"
        />

        {/* Primary 3D Fluid Organic Body */}
        <path
          d="M 55 65 C 42 35, 85 18, 125 22 C 165 26, 188 55, 182 95 C 176 135, 142 160, 98 152 C 54 144, 32 105, 55 65 Z"
          fill={`url(#blob-grad-${uniqueId})`}
        />

        {/* Fluid Contour Topography Layer 1 */}
        <path
          d="M 68 85 C 60 55, 95 38, 130 42 C 160 45, 172 70, 168 102 C 164 128, 136 142, 105 138 C 74 134, 60 105, 68 85 Z"
          fill={`url(#wave-grad-${uniqueId})`}
          opacity="0.6"
        />

        {/* Fluid Contour Topography Layer 2 */}
        <path
          d="M 85 100 C 78 78, 105 60, 135 64 C 158 68, 165 88, 160 112 C 155 130, 130 138, 112 134 C 94 130, 82 115, 85 100 Z"
          fill="#1E293B"
          opacity="0.35"
        />

        {/* Cybernetic Neural Network Lines */}
        <g stroke="#38BDF8" strokeWidth={mini ? '1' : '1.25'} opacity="0.75">
          <line x1="85" y1="45" x2="115" y2="40" />
          <line x1="115" y1="40" x2="145" y2="55" />
          <line x1="145" y1="55" x2="160" y2="85" />
          <line x1="115" y1="40" x2="128" y2="78" />
          <line x1="85" y1="45" x2="95" y2="80" />
          <line x1="95" y1="80" x2="128" y2="78" />
          <line x1="128" y1="78" x2="148" y2="105" />
          <line x1="160" y1="85" x2="148" y2="105" />
          <line x1="95" y1="80" x2="80" y2="115" />
          <line x1="80" y1="115" x2="115" y2="122" />
          <line x1="128" y1="78" x2="115" y2="122" />
          <line x1="115" y1="122" x2="148" y2="105" />
          <line x1="148" y1="105" x2="152" y2="135" />
          <line x1="115" y1="122" x2="130" y2="145" />

          {/* Secondary Faint Network Lines */}
          <line x1="62" y1="65" x2="85" y2="45" strokeDasharray="2 2" opacity="0.5" />
          <line x1="160" y1="85" x2="178" y2="75" strokeDasharray="2 2" opacity="0.5" />
          <line x1="145" y1="55" x2="168" y2="42" strokeDasharray="2 2" opacity="0.5" />
        </g>

        {/* Glowing Neural Network Nodes */}
        <g filter={`url(#node-glow-${uniqueId})`}>
          {/* Main Central Nodes */}
          <circle cx="128" cy="78" r={mini ? '2.5' : '3.5'} fill="#FFFFFF" />
          <circle cx="115" cy="40" r={mini ? '2' : '3'} fill="#E0F2FE" />
          <circle cx="145" cy="55" r={mini ? '2' : '2.5'} fill="#38BDF8" />
          <circle cx="95" cy="80" r={mini ? '2' : '2.5'} fill="#BAE6FD" />
          <circle cx="148" cy="105" r={mini ? '2.5' : '3.5'} fill="#FFFFFF" />
          <circle cx="115" cy="122" r={mini ? '2' : '3'} fill="#7DD3FC" />
          <circle cx="160" cy="85" r={mini ? '1.5' : '2.5'} fill="#E0F2FE" />
          <circle cx="85" cy="45" r={mini ? '1.5' : '2.5'} fill="#38BDF8" />
          <circle cx="80" cy="115" r={mini ? '1.5' : '2'} fill="#38BDF8" />
          <circle cx="130" cy="145" r={mini ? '1.5' : '2'} fill="#BAE6FD" />
          <circle cx="152" cy="135" r={mini ? '1.5' : '2'} fill="#7DD3FC" />
        </g>

        {/* Subtle Ambient Cosmic Particles */}
        <circle cx="45" cy="45" r="1.5" fill="#38BDF8" opacity="0.8" />
        <circle cx="175" cy="45" r="1.5" fill="#38BDF8" opacity="0.7" />
        <circle cx="35" cy="95" r="1" fill="#7DD3FC" opacity="0.6" />
        <circle cx="188" cy="115" r="1.5" fill="#38BDF8" opacity="0.8" />
        <circle cx="70" cy="155" r="1.2" fill="#BAE6FD" opacity="0.7" />
        <circle cx="165" cy="150" r="1.5" fill="#38BDF8" opacity="0.9" />
      </svg>
    </div>
  );
};
