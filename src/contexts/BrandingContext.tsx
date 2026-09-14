import React, { createContext, useContext, useState, useEffect } from 'react';
import { BrandingConfig } from '../types';
import {
  DEFAULT_BRANDING_CONFIG,
  getBrandingConfig,
  subscribeBrandingConfig,
} from '../services/brandingService';

interface BrandingContextType {
  branding: BrandingConfig;
  isLoading: boolean;
  refreshBranding: () => Promise<void>;
}

const BrandingContext = createContext<BrandingContextType>({
  branding: DEFAULT_BRANDING_CONFIG,
  isLoading: false,
  refreshBranding: async () => {},
});

export const BrandingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [branding, setBranding] = useState<BrandingConfig>(() => {
    // Initial quick read from localStorage cache if available for instant flicker-free rendering
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('arvin_branding_cache');
        if (cached) return JSON.parse(cached);
      } catch (_) {}
    }
    return DEFAULT_BRANDING_CONFIG;
  });
  const [isLoading, setIsLoading] = useState(true);

  const refreshBranding = async () => {
    try {
      const cfg = await getBrandingConfig();
      setBranding(cfg);
      if (typeof window !== 'undefined') {
        localStorage.setItem('arvin_branding_cache', JSON.stringify(cfg));
      }
    } catch (err) {
      console.warn('[BrandingContext] Refresh error:', err);
    }
  };

  useEffect(() => {
    // Subscribe to realtime updates from Firestore
    const unsubscribe = subscribeBrandingConfig((cfg) => {
      setBranding(cfg);
      setIsLoading(false);
      if (typeof window !== 'undefined') {
        localStorage.setItem('arvin_branding_cache', JSON.stringify(cfg));
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return (
    <BrandingContext.Provider value={{ branding, isLoading, refreshBranding }}>
      {children}
    </BrandingContext.Provider>
  );
};

export const useBranding = (): BrandingContextType => {
  return useContext(BrandingContext);
};
