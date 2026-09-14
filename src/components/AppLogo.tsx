import React, { useState, useEffect } from 'react';
import { LogoType } from '../types';
import { useBranding } from '../contexts/BrandingContext';
import { AsLogo } from './AsLogo';

interface AppLogoProps {
  type?: LogoType | 'general';
  size?: number;
  className?: string;
  variant?: 'dark' | 'light' | 'monochrome';
  customUrl?: string | null;
  alt?: string;
}

/**
 * Universal Branding Logo Component for ARVIN STUDIO.
 * Seamlessly integrates Firebase Storage + Firestore branding configurations.
 * If no custom logo is uploaded or if an image fails to load, gracefully falls back
 * to the default iconic ARVIN STUDIO monogram (<AsLogo />).
 */
export const AppLogo: React.FC<AppLogoProps> = ({
  type = 'general',
  size = 32,
  className = '',
  variant = 'dark',
  customUrl,
  alt = 'ARVIN STUDIO Logo',
}) => {
  const { branding } = useBranding();
  const [hasError, setHasError] = useState(false);

  // Determine active logo URL
  let targetUrl: string | null = null;

  if (customUrl !== undefined) {
    targetUrl = customUrl;
  } else if (type === 'splash') {
    targetUrl = branding.splashLogoUrl || null;
  } else if (type === 'header') {
    targetUrl = branding.headerLogoUrl || null;
  } else if (type === 'chat-ai') {
    targetUrl = branding.chatAiLogoUrl || null;
  } else {
    targetUrl = branding.headerLogoUrl || branding.splashLogoUrl || null;
  }

  // Reset error state if URL changes
  useEffect(() => {
    setHasError(false);
  }, [targetUrl]);

  if (targetUrl && !hasError) {
    return (
      <div
        className={`inline-flex items-center justify-center shrink-0 overflow-hidden ${className}`}
        style={{ width: size, height: size }}
      >
        <img
          src={targetUrl}
          alt={alt}
          onError={() => setHasError(true)}
          className="w-full h-full object-contain select-none pointer-events-none"
          crossOrigin="anonymous"
          referrerPolicy="no-referrer"
        />
      </div>
    );
  }

  // Default fallback to official ARVIN STUDIO Monogram
  return (
    <AsLogo
      size={size}
      className={className}
      variant={variant}
    />
  );
};
