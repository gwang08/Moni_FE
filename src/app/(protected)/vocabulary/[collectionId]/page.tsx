'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Zap, Loader2, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { WordDetailDialog } from '@/components/vocabulary/word-detail-dialog';
import { getMyWords, getMyLists } from '@/lib/vocab-api';
import { VocabWord, VocabCollection } from '@/types/vocab.types';

export default function CollectionDetailPage() {
  const { collectionId } = useParams<{ collectionId: string }>();
  const router = useRouter();
  const [selectedWord, setSelectedWord] = useState<VocabWord | null>(null);
  const [collection, setCollection] = useState<VocabCollection | null>(null);
  const [words, setWords] = useState<VocabWord[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const id = Number(collectionId);
        if (isNaN(id)) { setNotFound(true); return; }
        const [lists, page] = await Promise.all([
          getMyLists(),
          getMyWords(0, 100, id),
        ]);
        const found = lists.find((c) => c.id === id);
        if (!found) { setNotFound(true); return; }
        setCollection(found);
        setWords(page.content);
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [collectionId]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
      </div>
    );
  }

  if (notFound || !collection) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 text-center">
        <p className="text-gray-500">Bộ sưu tập không tồn tại.</p>
        <Link href="/vocabulary" className="mt-4 inline-block text-blue-600 hover:underline">
          Quay lại từ vựng
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      {/* Back + actions */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => router.push('/vocabulary')} className="gap-1">
          <ArrowLeft className="h-4 w-4" />
          Quay lại
        </Button>
        <Button
          onClick={() => router.push(`/vocabulary/flashcard?collection=${collectionId}`)}
          className="gap-2"
        >
          <Zap className="h-4 w-4" />
          Luyện Flashcard
        </Button>
      </div>

      {/* Collection header */}
      <div className="flex items-center gap-4">
        <span className="text-5xl">{collection.icon ?? '📁'}</span>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{collection.title}</h1>
          {collection.description && (
            <p className="text-gray-500 mt-1">{collection.description}</p>
          )}
          <Badge variant="secondary" className="mt-2">{words.length} từ</Badge>
        </div>
      </div>

      {/* Word list */}
      {words.length === 0 ? (
        <p className="text-center text-gray-400 py-12">Chưa có từ nào trong bộ sưu tập này.</p>
      ) : (
        <div className="space-y-3">
          {words.map((word) => (
            <button
              key={word.id}
              onClick={() => setSelectedWord(word)}
              className="w-full text-left rounded-xl border border-gray-200 bg-white p-5 shadow-sm
                hover:border-blue-300 hover:shadow-md transition-all duration-200"
            >
              <div className="flex items-center gap-3 mb-2">
                <span className="text-lg font-bold text-gray-900">{word.word}</span>
                {word.phonetic && (
                  <span className="text-sm text-gray-400">{word.phonetic}</span>
                )}
                {word.audioUrl && (
                  <button
                    onClick={(e) => { e.stopPropagation(); new Audio(word.audioUrl!).play().catch(() => {}); }}
                    className="text-gray-400 hover:text-blue-500"
                  >
                    <Volume2 className="h-4 w-4" />
                  </button>
                )}
                {word.pos && (
                  <Badge variant="outline" className="text-xs ml-auto">{word.pos}</Badge>
                )}
              </div>
              {word.definition && (
                <p className="text-sm text-gray-700">{word.definition}</p>
              )}
              {word.example && (
                <p className="text-sm text-gray-500 italic mt-1">{word.example}</p>
              )}
              {word.meaning && (
                <p className="text-sm text-blue-600 font-medium mt-2">{word.meaning}</p>
              )}
            </button>
          ))}
        </div>
      )}

      <WordDetailDialog
        word={selectedWord}
        open={!!selectedWord}
        onClose={() => setSelectedWord(null)}
      />
    </div>
  );
}
