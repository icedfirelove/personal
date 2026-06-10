'use client';

import { useState } from 'react';
import Image from 'next/image';
import { type Card } from '@/data/cards';

/** Small card-face thumbnail with bank-colour CSS fallback. */
export default function CardThumb({ card, className = 'w-14 h-9' }: { card: Card; className?: string }) {
  const [imgError, setImgError] = useState(false);
  return (
    <div
      className={`relative rounded-lg flex-shrink-0 overflow-hidden ${className}`}
      style={imgError || !card.imagePath ? { backgroundColor: card.bankColor } : {}}
    >
      {!imgError && card.imagePath ? (
        <Image
          src={card.imagePath}
          alt={card.cardName}
          fill
          className="object-cover"
          onError={() => setImgError(true)}
          sizes="64px"
        />
      ) : (
        <div className="absolute inset-0 flex items-end p-1" style={{ backgroundColor: card.bankColor }}>
          <span className="text-[7px] font-bold leading-tight" style={{ color: card.bankTextColor }}>
            {card.bank.toUpperCase()}
          </span>
        </div>
      )}
    </div>
  );
}
