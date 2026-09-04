import React from 'react';

interface AsLogoProps {
  size?: number;
  className?: string;
  variant?: 'dark' | 'light' | 'monochrome';
}

/**
 * ARVIN STUDIO (AS) Monogram:
 * A futuristic, minimalist interlocking monogram blending the letter 'A' and 'S'
 * into a single cohesive, iconic mark designed specifically for high-end technology.
 */
export const AsLogo: React.FC<AsLogoProps> = ({
  size = 32,
  className = '',
  variant = 'dark',
}) => {
  const primaryColor = variant === 'light' ? '#FFFFFF' : '#0F172A';
  const accentColor = variant === 'light' ? '#CBD5E1' : '#334155';
  const glowColor = variant === 'light' ? '#94A3B8' : '#64748B';

  return (
    <div
      className={`inline-flex items-center justify-center shrink-0 ${className}`}
      style={{ width: size, height: size }}
      aria-label="ARVIN STUDIO Monogram Logo"
    >
      <svg
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        <defs>
          <linearGradient id="as-grad-1" x1="8" y1="8" x2="56" y2="56" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor={primaryColor} />
            <stop offset="50%" stopColor={accentColor} />
            <stop offset="100%" stopColor={primaryColor} />
          </linearGradient>
          <linearGradient id="as-grad-accent" x1="16" y1="28" x2="48" y2="52" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor={accentColor} />
            <stop offset="100%" stopColor={glowColor} />
          </linearGradient>
        </defs>

        {/* Monogram A + S:
            Apex and left diagonal of 'A' seamlessly flowing into the upper spine of 'S',
            with the crossbar of 'A' bridging into the lower counter-curve of 'S',
            and the right foot anchoring the letter 'A'.
        */}
        {/* Left arm and apex of 'A' transitioning into upper loop of 'S' */}
        <path
          d="M 32 8 
             L 14 44 
             C 13 46 14.5 48 17 48 
             L 22 48 
             L 28 35 
             L 36 35 
             L 39 29 
             L 29.5 29 
             L 32 23.5 
             L 39 23.5 
             C 44.5 23.5 48.5 27 48.5 32 
             C 48.5 37 44 40.5 38 41 
             L 38 41"
          stroke="url(#as-grad-1)"
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Lower body of 'S' sweeping dynamically under the crossbar */}
        <path
          d="M 26 43.5 
             C 28 47.5 32.5 50.5 38 50.5 
             C 45 50.5 50 46.5 50 40.5 
             C 50 34 43 31.5 35 29.5 
             C 27 27.5 22 24.5 22 18.5 
             C 22 12.5 27 8.5 34 8.5 
             C 38 8.5 41.5 10 44 12.5"
          stroke="url(#as-grad-accent)"
          strokeWidth="4.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Right leg of 'A' that stabilizes the glyph */}
        <path
          d="M 40 37 
             L 49 55.5 
             C 49.5 56.5 50.8 57 52 57 
             L 54 57"
          stroke="url(#as-grad-1)"
          strokeWidth="5"
          strokeLinecap="round"
        />

        {/* Subtle geometric dot accent for technological precision */}
        <circle cx="32" cy="17" r="2.2" fill={primaryColor} />
      </svg>
    </div>
  );
};
