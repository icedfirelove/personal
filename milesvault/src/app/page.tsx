'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { loadProfile } from '@/lib/storage';

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    const profile = loadProfile();
    if (profile?.setupComplete) {
      router.replace('/overview');
    } else {
      router.replace('/onboarding/income');
    }
  }, [router]);

  // Blank while redirecting
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-8 h-8 border-2 border-outline-bright border-t-primary rounded-full animate-spin" />
    </div>
  );
}
