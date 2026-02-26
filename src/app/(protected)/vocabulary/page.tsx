'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, BookOpen, Zap } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { VocabCard } from '@/components/vocabulary/vocab-card';
import { VOCAB_COLLECTIONS, VOCAB_WORDS } from '@/data/vocab-mock';

export default function VocabularyPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');

  const filtered = search.trim()
    ? VOCAB_WORDS.filter(
        (w) =>
          w.word.toLowerCase().includes(search.toLowerCase()) ||
          w.definition.toLowerCase().includes(search.toLowerCase()) ||
          w.translation.toLowerCase().includes(search.toLowerCase())
      )
    : VOCAB_WORDS;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Từ Vựng</h1>
          <p className="text-gray-500 mt-1">Học từ vựng theo bộ sưu tập</p>
        </div>
        <Button onClick={() => router.push('/vocabulary/flashcard')} className="gap-2">
          <Zap className="h-4 w-4" />
          Luyện Flashcard
        </Button>
      </div>

      {/* Collections grid */}
      <section>
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Bộ sưu tập</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {VOCAB_COLLECTIONS.map((col) => (
            <Link key={col.id} href={`/vocabulary/${col.id}`}>
              <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm
                hover:border-blue-300 hover:shadow-md transition-all duration-200 cursor-pointer h-full">
                <div className="flex items-start gap-3">
                  <span className="text-3xl">{col.icon}</span>
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900">{col.name}</p>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">{col.description}</p>
                    <Badge variant="secondary" className="mt-2 text-xs">
                      <BookOpen className="h-3 w-3 mr-1" />
                      {col.wordCount} từ
                    </Badge>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* All words section */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800">Tất cả từ vựng</h2>
          <span className="text-sm text-gray-400">{filtered.length} từ</span>
        </div>

        {/* Search */}
        <div className="relative mb-5">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Tìm theo từ, định nghĩa, bản dịch..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {filtered.length === 0 ? (
          <p className="text-center text-gray-400 py-12">Không tìm thấy từ nào</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filtered.map((word) => (
              <VocabCard key={word.id} word={word} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
