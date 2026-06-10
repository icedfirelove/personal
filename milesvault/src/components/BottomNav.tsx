'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

const TABS = [
  { href: '/overview',     icon: '📊', label: 'Overview' },
  { href: '/recommend',    icon: '⚡', label: 'Swipe' },
  { href: '/transactions', icon: '🧾', label: 'Txns' },
  { href: '/promos',       icon: '🎯', label: 'Promos' },
  { href: '/dashboard',    icon: '💳', label: 'Vault' },
];

export default function BottomNav() {
  const router = useRouter();
  const pathname = usePathname();
  // Optimistic selection: highlight the tapped tab instantly, before the
  // route actually changes (chunk download can take a moment on first visit).
  const [pending, setPending] = useState<string | null>(null);

  // Prefetch every tab's code so first taps are instant
  useEffect(() => {
    TABS.forEach(t => router.prefetch(t.href));
  }, [router]);

  // Clear the optimistic state once navigation completes
  useEffect(() => {
    setPending(null);
  }, [pathname]);

  const current = pending ?? pathname;

  return (
    <nav className="fixed bottom-0 inset-x-0 z-30 bg-surface/90 backdrop-blur-md border-t border-outline nav-safe">
      <div className="max-w-2xl mx-auto grid grid-cols-5">
        {TABS.map(tab => {
          const active = current.startsWith(tab.href);
          return (
            <button
              key={tab.href}
              onClick={() => {
                if (current.startsWith(tab.href)) return;
                setPending(tab.href);
                router.push(tab.href);
              }}
              aria-current={active ? 'page' : undefined}
              className="group flex flex-col items-center gap-0.5 pt-2 pb-1.5 select-none active:scale-90 transition-transform duration-100"
            >
              {/* M3 active-indicator pill */}
              <span
                className={`flex items-center justify-center w-14 h-7 rounded-full text-base leading-none transition-colors duration-150 ${
                  active ? 'bg-primary/15' : 'group-hover:bg-surface-high'
                }`}
              >
                {tab.icon}
              </span>
              <span
                className={`text-[10px] tracking-wide transition-colors duration-150 ${
                  active ? 'font-bold text-primary' : 'font-medium text-on-surface-variant'
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
