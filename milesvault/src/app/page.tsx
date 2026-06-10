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
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin" />
    </div>
  );
}
