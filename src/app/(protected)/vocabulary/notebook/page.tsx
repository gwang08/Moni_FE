'use client';

import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MyNotebookTab } from '@/components/vocabulary/my-notebook-tab';

export default function NotebookPage() {
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
        </div>
        <MyNotebookTab />
      </div>
    </div>
  );
}
