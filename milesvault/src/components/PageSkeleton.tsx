import BottomNav from '@/components/BottomNav';

/**
 * Generic page skeleton shown while a tab's code/data loads.
 * Mirrors the standard layout (sticky header + card list) so the
 * transition feels seamless. Includes the bottom nav so navigation
 * chrome never flickers away between tabs.
 */
export default function PageSkeleton() {
  return (
    <div className="min-h-screen bg-background page-bottom">
      {/* Header skeleton */}
      <div className="sticky top-0 z-20 bg-surface border-b border-outline px-4 pb-4 header-safe">
        <div className="max-w-2xl mx-auto space-y-2">
          <div className="h-5 w-40 rounded-lg bg-surface-high animate-pulse" />
          <div className="h-3 w-56 rounded bg-surface-high animate-pulse" />
        </div>
      </div>

      {/* Card list skeleton */}
      <div className="max-w-2xl mx-auto px-4 pt-5 space-y-3">
        {[0, 1, 2, 3].map(i => (
          <div
            key={i}
            className="bg-surface border border-outline rounded-2xl p-4 space-y-3 animate-pulse"
            style={{ animationDelay: `${i * 100}ms` }}
          >
            <div className="flex items-center gap-3">
              <div className="w-14 h-9 rounded-lg bg-surface-high flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3.5 w-2/3 rounded bg-surface-high" />
                <div className="h-3 w-2/5 rounded bg-surface-high" />
              </div>
              <div className="h-4 w-12 rounded bg-surface-high flex-shrink-0" />
            </div>
            <div className="h-1.5 rounded-full bg-surface-high" />
          </div>
        ))}
      </div>

      <BottomNav />
    </div>
  );
}
