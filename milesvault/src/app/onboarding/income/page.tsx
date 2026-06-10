'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { INCOME_BRACKETS, type IncomeBracket, loadProfile, saveProfile } from '@/lib/storage';

export default function IncomePage() {
  const router = useRouter();
  const [selected, setSelected] = useState<IncomeBracket | null>(null);

  useEffect(() => {
    const profile = loadProfile();
    if (profile?.incomeBracket) setSelected(profile.incomeBracket);
  }, []);

  function handleContinue() {
    if (!selected) return;
    saveProfile({ incomeBracket: selected });
    router.push('/onboarding/cards');
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="px-6 pt-14 pb-8 text-center">
        <p className="text-xs font-semibold tracking-widest text-gray-400 uppercase mb-4">
          Step 1 of 2
        </p>
        <div className="flex justify-center gap-2 mb-8">
          <div className="h-1 w-16 rounded-full bg-gray-900" />
          <div className="h-1 w-16 rounded-full bg-gray-200" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          What&apos;s your annual income?
        </h1>
        <p className="text-sm text-gray-500 max-w-xs mx-auto">
          Used to show you cards you qualify for and personalise recommendations.
        </p>
      </div>

      {/* Options */}
      <div className="flex-1 px-6 pb-8 max-w-sm mx-auto w-full space-y-3">
        {INCOME_BRACKETS.map((bracket) => {
          const isSelected = selected === bracket.value;
          return (
            <button
              key={bracket.value}
              onClick={() => setSelected(bracket.value)}
              className={`w-full text-left px-5 py-4 rounded-2xl border-2 transition-all duration-150 ${
                isSelected
                  ? 'border-gray-900 bg-gray-900 text-white shadow-sm'
                  : 'border-gray-200 bg-white text-gray-900 hover:border-gray-400'
              }`}
            >
              <span className="font-semibold text-base">{bracket.label}</span>
            </button>
          );
        })}
      </div>

      {/* CTA */}
      <div className="px-6 pb-12 max-w-sm mx-auto w-full">
        <button
          onClick={handleContinue}
          disabled={!selected}
          className="w-full py-4 rounded-2xl bg-gray-900 text-white font-semibold text-base
                     disabled:opacity-30 disabled:cursor-not-allowed
                     hover:bg-gray-800 active:scale-[0.98] transition-all"
        >
          Continue →
        </button>
      </div>
    </div>
  );
}
