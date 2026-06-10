'use client';

import { useEffect } from 'react';

export default function ServiceWorkerRegistration() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    const isLocalhost =
      location.hostname === 'localhost' || location.hostname === '127.0.0.1';

    if (isLocalhost) {
      // Never cache in development — and clean up any previously
      // registered service workers that keep serving stale bundles.
      navigator.serviceWorker.getRegistrations().then(regs => {
        regs.forEach(reg => reg.unregister());
      });
      if ('caches' in window) {
        caches.keys().then(keys => keys.forEach(k => caches.delete(k)));
      }
      return;
    }

    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then((reg) => {
        console.log('[MilesVault] Service worker registered:', reg.scope);
      })
      .catch((err) => {
        console.warn('[MilesVault] Service worker registration failed:', err);
      });
  }, []);

  return null;
}
