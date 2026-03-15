'use client';

import { use } from 'react';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CuratedWordListWithFilters } from '@/components/vocabulary/curated-word-list-with-filters';

const BAND_THEME: Record<string, { badge: string }> = {
  '3-4':     { badge: 'bg-teal-500' },
  '4-5':     { badge: 'bg-emerald-500' },
  '5.5-6.5': { badge: 'bg-blue-500' },
  '7-8':     { badge: 'bg-violet-500' },
  '8.5-9':   { badge: 'bg-amber-500' },
};

export default function BandDetailPage({ params }: { params: Promise<{ band: string }> }) {
  const { band } = use(params);
  const decoded = decodeURIComponent(band);
  const theme = BAND_THEME[decoded] ?? { badge: 'bg-gray-500' };

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-5">
        <div className="flex items-center gap-3 mb-5">
          <Link href="/vocabulary">
            <Button variant="ghost" size="sm" className="gap-1.5 text-gray-500 hover:text-gray-700 rounded-xl">
              <ChevronLeft className="h-4 w-4" />
              {'T\u1eeb v\u1ef1ng'}
            </Button>
          </Link>
          <span className={`text-sm font-bold px-3.5 py-1.5 rounded-xl text-white ${theme.badge}`}>
            Band {decoded}
          </span>
        </div>
        <CuratedWordListWithFilters band={decoded} />
      </div>
    </div>
  );
}
