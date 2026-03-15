'use client';

import { useState, useEffect } from 'react';
import {
  ChevronLeft, Loader2, Volume2,
  Leaf, Cpu, HeartPulse, GraduationCap, Briefcase,
  FlaskConical, Plane, UtensilsCrossed, Users, Palette,
  BookText,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getTopics, browseCurated } from '@/lib/vocab-api';
import type { TopicSummary, CuratedWord } from '@/types/vocab.types';
import type { LucideIcon } from 'lucide-react';

/** Map topic key → Lucide icon component + color classes */
const TOPIC_CONFIG: Record<string, { icon: LucideIcon; bg: string; color: string }> = {
  environment:  { icon: Leaf,            bg: 'bg-green-100',   color: 'text-green-600' },
  technology:   { icon: Cpu,             bg: 'bg-blue-100',    color: 'text-blue-600' },
  health:       { icon: HeartPulse,      bg: 'bg-rose-100',    color: 'text-rose-600' },
  education:    { icon: GraduationCap,   bg: 'bg-indigo-100',  color: 'text-indigo-600' },
  business:     { icon: Briefcase,       bg: 'bg-amber-100',   color: 'text-amber-600' },
  science:      { icon: FlaskConical,    bg: 'bg-purple-100',  color: 'text-purple-600' },
  travel:       { icon: Plane,           bg: 'bg-sky-100',     color: 'text-sky-600' },
  food:         { icon: UtensilsCrossed, bg: 'bg-orange-100',  color: 'text-orange-600' },
  society:      { icon: Users,           bg: 'bg-teal-100',    color: 'text-teal-600' },
  arts:         { icon: Palette,         bg: 'bg-pink-100',    color: 'text-pink-600' },
};

const DEFAULT_CONFIG = { icon: BookText, bg: 'bg-gray-100', color: 'text-gray-600' };

function getTopicConfig(topic: string) {
  return TOPIC_CONFIG[topic.toLowerCase()] ?? DEFAULT_CONFIG;
}

function CuratedWordCard({ word }: { word: CuratedWord }) {
  const playAudio = () => {
    if (word.audioUrl) new Audio(word.audioUrl).play().catch(() => {});
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-gray-900">{word.word}</p>
            {word.audioUrl && (
              <button onClick={playAudio} className="text-gray-400 hover:text-blue-500" title="Nghe phát âm">
                <Volume2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          {word.phonetic && <p className="text-xs text-gray-400">{word.phonetic}</p>}
        </div>
        {word.pos && (
          <Badge variant="outline" className="text-xs shrink-0">{word.pos}</Badge>
        )}
      </div>
      {word.meaning && <p className="text-sm text-blue-600 font-medium">{word.meaning}</p>}
      {word.definition && <p className="text-xs text-gray-600 line-clamp-2">{word.definition}</p>}
    </div>
  );
}

export function TopicBrowseTab() {
  const [topics, setTopics] = useState<TopicSummary[]>([]);
  const [loadingTopics, setLoadingTopics] = useState(true);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [words, setWords] = useState<CuratedWord[]>([]);
  const [loadingWords, setLoadingWords] = useState(false);

  useEffect(() => {
    getTopics()
      .then(setTopics)
      .catch(() => {})
      .finally(() => setLoadingTopics(false));
  }, []);

  const handleSelectTopic = async (topic: string) => {
    setSelectedTopic(topic);
    setLoadingWords(true);
    setWords([]);
    try {
      const page = await browseCurated(0, 50, undefined, topic);
      setWords(page.content);
    } catch {
      setWords([]);
    } finally {
      setLoadingWords(false);
    }
  };

  if (selectedTopic) {
    const { icon: TopicIcon, bg, color } = getTopicConfig(selectedTopic);
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => setSelectedTopic(null)} className="gap-1">
            <ChevronLeft className="h-4 w-4" />
            Quay lại
          </Button>
          <span className={`inline-flex items-center justify-center rounded-lg p-1 ${bg}`}>
            <TopicIcon className={`h-4 w-4 ${color}`} />
          </span>
          <span className="font-semibold text-gray-800 capitalize">{selectedTopic}</span>
          {!loadingWords && (
            <Badge variant="secondary" className="ml-auto">{words.length} từ</Badge>
          )}
        </div>

        {loadingWords ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-blue-400" />
          </div>
        ) : words.length === 0 ? (
          <p className="text-center text-gray-400 py-12">Không có từ vựng nào</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {words.map((w) => <CuratedWordCard key={w.id} word={w} />)}
          </div>
        )}
      </div>
    );
  }

  if (loadingTopics) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-blue-400" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">Chọn chủ đề để xem từ vựng tương ứng</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {topics.map((t) => {
          const { icon: Icon, bg, color } = getTopicConfig(t.topic);
          return (
            <button
              key={t.topic}
              onClick={() => handleSelectTopic(t.topic)}
              className="rounded-xl border border-gray-200 bg-white p-4 text-left
                hover:border-blue-300 hover:shadow-md transition-all duration-200 cursor-pointer"
            >
              <span className={`inline-flex items-center justify-center rounded-lg p-2 ${bg}`}>
                <Icon className={`h-5 w-5 ${color}`} />
              </span>
              <p className="mt-2 font-semibold text-sm text-gray-800 capitalize">{t.topic}</p>
              <p className="text-xs text-gray-500 mt-1">{t.wordCount.toLocaleString()} từ</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
