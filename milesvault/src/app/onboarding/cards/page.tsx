'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { CARDS, BANKS, type Card } from '@/data/cards';
import { loadProfile, saveProfile } from '@/lib/storage';

function CardPickerTile({
  card,
  isSelected,
  onToggle,
}: {
  card: Card;
  isSelected: boolean;
  onToggle: () => void;
}) {
  const [imgError, setImgError] = useState(false);

  return (
    <button
      onClick={onToggle}
      className={`relative flex flex-col rounded-2xl overflow-hidden border-2 transition-all duration-150 text-left w-full
        ${isSelected
          ? 'border-gray-900 shadow-md scale-[1.02]'
          : 'border-transparent shadow-sm hover:border-gray-700 hover:shadow-md'
        }`}
    >
      {/* Card image or CSS fallback */}
      <div
        className="relative w-full aspect-[1.586/1] flex items-end p-3"
        style={imgError || !card.imagePath ? { backgroundColor: card.bankColor } : {}}
      >
        {!imgError && card.imagePath ? (
          <Image
            src={card.imagePath}
            alt={card.cardName}
            fill
            className="object-cover"
            onError={() => setImgError(true)}
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        ) : (
          /* CSS fallback card */
          <div className="absolute inset-0 flex flex-col justify-between p-3"
               style={{ backgroundColor: card.bankColor, color: card.bankTextColor }}>
            <div className="flex justify-between items-start">
              <span className="text-xs font-bold tracking-wide opacity-90">{card.bank.toUpperCase()}</span>
              <span className="text-xs opacity-70">{card.cardType}</span>
            </div>
            <div>
              <div className="w-7 h-5 rounded-sm bg-yellow-300/60 mb-2" />
              <p className="text-xs font-semibold leading-tight opacity-95">{card.cardName}</p>
            </div>
          </div>
        )}

        {/* Selection checkmark */}
        {isSelected && (
          <div className="absolute top-2 right-2 z-10 w-6 h-6 rounded-full bg-gray-900 flex items-center justify-center shadow">
            <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
        )}
      </div>

      {/* Card info */}
      <div className="bg-gray-900 px-3 py-2.5 flex-1">
        <p className="text-xs font-semibold text-gray-100 leading-tight truncate">{card.cardName}</p>
        <p className="text-xs text-gray-400 mt-0.5 leading-tight line-clamp-2">{card.tagline}</p>
      </div>
    </button>
  );
}

export default function CardsPage() {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [activeBank, setActiveBank] = useState<string>('All');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const profile = loadProfile();
    if (!profile?.incomeBracket) {
      router.replace('/onboarding/income');
      return;
    }
    if (profile.selectedCardIds) setSelectedIds(profile.selectedCardIds);
  }, [router]);

  const allBanks = ['All', ...BANKS];

  const filteredCards = useMemo(() => {
    return CARDS.filter(card => {
      const bankMatch = activeBank === 'All' || card.bank === activeBank;
      const searchMatch =
        !search ||
        card.cardName.toLowerCase().includes(search.toLowerCase()) ||
        card.bank.toLowerCase().includes(search.toLowerCase()) ||
        card.tagline.toLowerCase().includes(search.toLowerCase());
      return bankMatch && searchMatch;
    });
  }, [activeBank, search]);

  function toggleCard(id: string) {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  }

  function handleDone() {
    saveProfile({ selectedCardIds: selectedIds, setupComplete: true });
    router.push('/dashboard');
  }

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-gray-950/95 backdrop-blur-sm border-b border-gray-800 px-4 pb-3 pt-[calc(2rem+env(safe-area-inset-top))]">
        <div className="max-w-3xl mx-auto">
          <p className="text-xs font-semibold tracking-widest text-gray-400 uppercase mb-3">
            Step 2 of 2
          </p>
          <div className="flex gap-2 mb-4">
            <div className="h-1 w-16 rounded-full bg-gray-900" />
            <div className="h-1 w-16 rounded-full bg-gray-900" />
          </div>
          <div className="flex items-end justify-between mb-3">
            <div>
              <h1 className="text-xl font-bold text-gray-100">Which cards do you own?</h1>
              <p className="text-xs text-gray-500 mt-0.5">Select all that apply.</p>
            </div>
            {selectedIds.length > 0 && (
              <span className="text-xs font-semibold text-gray-100 bg-gray-200 rounded-full px-2.5 py-1">
                {selectedIds.length} selected
              </span>
            )}
          </div>

          {/* Search */}
          <div className="relative mb-3">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search cards..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-gray-900 border border-gray-700 text-sm text-gray-100 placeholder:text-gray-400 focus:outline-none focus:border-gray-400"
            />
          </div>

          {/* Bank filter pills */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {allBanks.map(bank => (
              <button
                key={bank}
                onClick={() => setActiveBank(bank)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                  activeBank === bank
                    ? 'bg-gray-100 text-gray-900'
                    : 'bg-gray-900 text-gray-400 border border-gray-700 hover:border-gray-500'
                }`}
              >
                {bank}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Card grid */}
      <div className="flex-1 px-4 pt-4 pb-32 max-w-3xl mx-auto w-full">
        {filteredCards.length === 0 ? (
          <div className="text-center py-16 text-gray-400 text-sm">
            No cards match your search.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {filteredCards.map(card => (
              <CardPickerTile
                key={card.id}
                card={card}
                isSelected={selectedIds.includes(card.id)}
                onToggle={() => toggleCard(card.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Fixed bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 bg-gray-950/95 backdrop-blur-sm border-t border-gray-800 px-4 pt-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
        <div className="max-w-3xl mx-auto flex gap-3">
          <button
            onClick={() => router.back()}
            className="px-5 py-3.5 rounded-2xl border-2 border-gray-700 text-gray-300 font-semibold text-sm hover:border-gray-500 transition-colors"
          >
            Back
          </button>
          <button
            onClick={handleDone}
            className="flex-1 py-3.5 rounded-2xl bg-gray-100 text-gray-900 font-semibold text-sm
                       hover:bg-gray-300 active:scale-[0.98] transition-all"
          >
            {selectedIds.length === 0 ? "Skip for now →" : `Done — ${selectedIds.length} card${selectedIds.length === 1 ? '' : 's'} →`}
          </button>
        </div>
      </div>
    </div>
  );
}
