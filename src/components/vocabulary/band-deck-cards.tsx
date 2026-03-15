'use client';

import Link from 'next/link';
import Image from 'next/image';
import { BookOpen, Users } from 'lucide-react';
import type { BandSummary } from '@/types/vocab.types';

const BAND_CFG: Record<string, { img: string; title: string }> = {
  '3-4':     { img: '/vocab/band-a1.jpg',     title: 'T\u1eeb v\u1ef1ng IELTS c\u01a1 b\u1ea3n A1-A2' },
  '4-5':     { img: '/vocab/band-a2.webp',    title: 'T\u1eeb v\u1ef1ng IELTS Band 4-5' },
  '5.5-6.5': { img: '/vocab/band-b1.jpg',    title: 'T\u1eeb v\u1ef1ng IELTS Band 5.5-6.5' },
  '7-8':     { img: '/vocab/band-b2.jpg',     title: 'T\u1eeb v\u1ef1ng IELTS n\u00e2ng cao Band 7-8' },
  '8.5-9':   { img: '/vocab/band-conv.jpg',   title: 'T\u1eeb v\u1ef1ng IELTS xu\u1ea5t s\u1eafc Band 8.5-9' },
};

const T = {
  cta: 'B\u1eaft \u0111\u1ea7u H\u1ecdc',
  cards: 'th\u1ebb',
};

function BandDeckCard({ band }: { band: BandSummary }) {
  const cfg = BAND_CFG[band.band] ?? { img: '/vocab/band-common.webp', title: `T\u1eeb v\u1ef1ng Band ${band.band}` };

  return (
    <Link
      href={`/vocabulary/band/${band.band}`}
      className="group block rounded-lg border border-gray-200 bg-white
        hover:shadow-lg transition-all duration-300"
    >
      <div className="p-4">
        {/* Thumbnail - exact Parroto style */}
        <div className="w-full h-44 mb-3 rounded-lg overflow-hidden bg-gray-100 relative">
          <Image
            src={cfg.img}
            alt={`Band ${band.band}`}
            fill
            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
          />
        </div>

        {/* Title */}
        <div className="mb-3">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <p className="font-semibold text-[16px] leading-[20px] line-clamp-2">
                {cfg.title}
              </p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
          <div className="flex items-center gap-1">
            <BookOpen className="h-4 w-4" />
            <span>{band.wordCount.toLocaleString()} {T.cards}</span>
          </div>
        </div>

        {/* CTA */}
        <div className="flex gap-2">
          <button className="inline-flex items-center justify-center whitespace-nowrap
            text-sm font-medium bg-primary text-primary-foreground shadow-xs
            hover:bg-primary/80 transition-all rounded-md flex-1 h-10">
            {T.cta}
          </button>
        </div>
      </div>
    </Link>
  );
}

export function BandDeckCards({ bands }: { bands: BandSummary[] }) {
  if (bands.length === 0) return null;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {bands.map(b => <BandDeckCard key={b.band} band={b} />)}
    </div>
  );
}
