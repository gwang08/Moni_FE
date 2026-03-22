'use client';

import { use } from 'react';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CuratedWordListWithFilters } from '@/components/vocabulary/curated-word-list-with-filters';

export default function TopicDetailPage({ params }: { params: Promise<{ topic: string }> }) {
  const { topic } = use(params);
  const decoded = decodeURIComponent(topic);

  return (
    <div className="min-h-screen">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-5">
        <div className="flex items-center gap-3 mb-5">
          <Link href="/vocabulary">
            <Button variant="ghost" size="sm" className="gap-1.5 text-gray-500 hover:text-gray-700 rounded-xl">
              <ChevronLeft className="h-4 w-4" />
              {'T\u1eeb v\u1ef1ng'}
            </Button>
          </Link>
          <span className="text-lg font-bold text-gray-800 capitalize">{decoded}</span>
        </div>
        <CuratedWordListWithFilters topic={decoded} />
      </div>
    </div>
  );
}
