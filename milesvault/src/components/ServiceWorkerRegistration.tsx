'use client';

import { useEffect } from 'react';

export default function ServiceWorkerRegistration() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js', { scope: '/' })
        .then((reg) => {
          console.log('[MilesVault] Service worker registered:', reg.scope);
        })
        .catch((err) => {
          console.warn('[MilesVault] Service worker registration failed:', err);
        });
    }
  }, []);

  return null;
}
