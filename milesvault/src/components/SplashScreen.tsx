'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

/**
 * Branded splash shown on cold app launch (full page load).
 * Lives in the root layout, so SPA tab switches never re-trigger it.
 * Logo pops in, wordmark slides up, whole thing fades out.
 */
export default function SplashScreen() {
  const [phase, setPhase] = useState<'show' | 'fade' | 'gone'>('show');

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('fade'), 1300);
    const t2 = setTimeout(() => setPhase('gone'), 1800);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  if (phase === 'gone') return null;

  return (
    <div
      aria-hidden
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background transition-opacity duration-500 ${
        phase === 'fade' ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <div className="splash-logo">
        <Image
          src="/icons/icon-192.png"
          width={96}
          height={96}
          alt="MilesVault logo"
          priority
          className="rounded-[28px] shadow-2xl shadow-primary/20"
        />
      </div>

      <h1 className="splash-wordmark font-display text-4xl font-bold tracking-tight text-on-surface mt-6">
        Miles<span className="text-primary">Vault</span>
      </h1>

      <p className="splash-tag text-[11px] font-semibold text-on-surface-variant mt-2.5 tracking-[0.25em] uppercase">
        Right card · Every swipe
      </p>
    </div>
  );
}
