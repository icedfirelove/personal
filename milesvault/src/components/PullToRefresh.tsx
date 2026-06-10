'use client';

import { useRef, useState, type ReactNode } from 'react';

const THRESHOLD = 70;   // px of (resisted) pull needed to trigger
const MAX_PULL = 110;

/**
 * Touch-driven pull-to-refresh. Activates only when the page is scrolled
 * to the top; applies rubber-band resistance; shows a spinner while the
 * async onRefresh runs.
 */
export default function PullToRefresh({
  onRefresh,
  children,
}: {
  onRefresh: () => Promise<void>;
  children: ReactNode;
}) {
  const startY = useRef<number | null>(null);
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  function onTouchStart(e: React.TouchEvent) {
    if (window.scrollY > 0 || refreshing) return;
    startY.current = e.touches[0].clientY;
  }

  function onTouchMove(e: React.TouchEvent) {
    if (startY.current === null || refreshing) return;
    const delta = e.touches[0].clientY - startY.current;
    if (delta <= 0 || window.scrollY > 0) {
      setPull(0);
      return;
    }
    // rubber-band resistance
    setPull(Math.min(MAX_PULL, delta * 0.45));
  }

  async function onTouchEnd() {
    if (startY.current === null) return;
    startY.current = null;
    if (pull >= THRESHOLD && !refreshing) {
      setRefreshing(true);
      setPull(48); // hold indicator open while refreshing
      try {
        await onRefresh();
      } finally {
        setRefreshing(false);
        setPull(0);
      }
    } else {
      setPull(0);
    }
  }

  const armed = pull >= THRESHOLD;

  return (
    <div onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>
      {/* Pull indicator */}
      <div
        className="flex items-end justify-center overflow-hidden transition-[height] duration-150"
        style={{ height: pull }}
      >
        <div className="pb-3 flex flex-col items-center gap-1">
          <div
            className={`w-6 h-6 border-2 rounded-full transition-colors ${
              refreshing
                ? 'border-outline-bright border-t-primary animate-spin'
                : armed
                  ? 'border-primary'
                  : 'border-outline-bright'
            }`}
            style={
              !refreshing
                ? { transform: `rotate(${(pull / MAX_PULL) * 360}deg)`, borderTopColor: 'var(--color-primary)' }
                : undefined
            }
          />
          <span className="text-[10px] font-semibold text-on-surface-variant">
            {refreshing ? 'Checking for new promos…' : armed ? 'Release to refresh' : 'Pull to refresh'}
          </span>
        </div>
      </div>
      {children}
    </div>
  );
}
