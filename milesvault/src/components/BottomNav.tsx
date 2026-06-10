'use client';

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

  return (
    <nav className="fixed bottom-0 inset-x-0 z-30 bg-surface border-t border-outline nav-safe">
      <div className="max-w-2xl mx-auto grid grid-cols-5">
        {TABS.map(tab => {
          const active = pathname.startsWith(tab.href);
          return (
            <button
              key={tab.href}
              onClick={() => router.push(tab.href)}
              className={`flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-semibold transition-colors ${
                active ? 'text-primary' : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <span className="text-lg leading-none">{tab.icon}</span>
              {tab.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
