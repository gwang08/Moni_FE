'use client';

import { useState, useEffect } from 'react';
import {
  ChevronLeft, ChevronRight, Loader2, Volume2,
  Leaf, Cpu, HeartPulse, GraduationCap, Briefcase,
  FlaskConical, Plane, UtensilsCrossed, Users, Palette,
  BookText,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getTopics, browseCurated } from '@/lib/vocab-api';
import type { TopicSummary, CuratedWord } from '@/types/vocab.types';
import type { LucideIcon } from 'lucide-react';
import { CuratedWordListWithFilters } from './curated-word-list-with-filters';

const POS_BADGE: Record<string, string> = {
  noun: 'bg-blue-500 text-white',
  verb: 'bg-emerald-500 text-white',
  adj: 'bg-amber-500 text-white',
  adv: 'bg-purple-500 text-white',
  adjective: 'bg-amber-500 text-white',
  adverb: 'bg-purple-500 text-white',
};

const TOPIC_CONFIG: Record<string, { icon: LucideIcon; bg: string; color: string; gradient: string }> = {
  environment:  { icon: Leaf,            bg: 'bg-green-500',   color: 'text-green-600',  gradient: 'from-green-500 to-emerald-500' },
  technology:   { icon: Cpu,             bg: 'bg-blue-500',    color: 'text-blue-600',   gradient: 'from-blue-500 to-sky-500' },
  health:       { icon: HeartPulse,      bg: 'bg-rose-500',    color: 'text-rose-600',   gradient: 'from-rose-500 to-pink-500' },
  education:    { icon: GraduationCap,   bg: 'bg-indigo-500',  color: 'text-indigo-600', gradient: 'from-indigo-500 to-blue-500' },
  business:     { icon: Briefcase,       bg: 'bg-amber-500',   color: 'text-amber-600',  gradient: 'from-amber-500 to-yellow-500' },
  science:      { icon: FlaskConical,    bg: 'bg-purple-500',  color: 'text-purple-600', gradient: 'from-purple-500 to-violet-500' },
  travel:       { icon: Plane,           bg: 'bg-sky-500',     color: 'text-sky-600',    gradient: 'from-sky-500 to-cyan-500' },
  food:         { icon: UtensilsCrossed, bg: 'bg-orange-500',  color: 'text-orange-600', gradient: 'from-orange-500 to-amber-500' },
  society:      { icon: Users,           bg: 'bg-teal-500',    color: 'text-teal-600',   gradient: 'from-teal-500 to-cyan-500' },
  arts:         { icon: Palette,         bg: 'bg-pink-500',    color: 'text-pink-600',   gradient: 'from-pink-500 to-rose-500' },
};

const DEFAULT_CFG = { icon: BookText, bg: 'bg-gray-500', color: 'text-gray-600', gradient: 'from-gray-400 to-gray-500' };

function getTopicCfg(topic: string) {
  return TOPIC_CONFIG[topic.toLowerCase()] ?? DEFAULT_CFG;
}

function WordPreviewRow({ word }: { word: CuratedWord }) {
  const playAudio = () => {
    if (word.audioUrl) new Audio(word.audioUrl).play().catch(() => {});
  };
  const posColor = word.pos ? (POS_BADGE[word.pos.toLowerCase()] ?? 'bg-gray-500 text-white') : '';

  return (
    <div className="flex items-center gap-3 py-3 border-b border-gray-50 last:border-0
      hover:bg-gray-50/50 transition-colors px-1 rounded-lg">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-base font-bold text-gray-900">{word.word}</span>
          {word.phonetic && (
            <span className="text-xs text-gray-400 font-mono">{word.phonetic}</span>
          )}
          {word.audioUrl && (
            <button
              onClick={playAudio}
              className="text-gray-300 hover:text-indigo-500 transition-colors"
            >
              <Volume2 className="h-3.5 w-3.5" />
            </button>
          )}
          {word.pos && (
            <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${posColor}`}>
              {word.pos}
            </span>
          )}
        </div>
        {word.meaning && (
          <p className="text-sm text-indigo-600 font-medium mt-0.5 truncate">{word.meaning}</p>
        )}
      </div>
    </div>
  );
}

function TopicPreviewSection({ topic, onViewAll }: { topic: TopicSummary; onViewAll: () => void }) {
  const [words, setWords] = useState<CuratedWord[]>([]);
  const [loading, setLoading] = useState(true);
  const cfg = getTopicCfg(topic.topic);
  const Icon = cfg.icon;

  useEffect(() => {
    browseCurated(0, 5, undefined, topic.topic)
      .then(page => setWords(page.content))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [topic.topic]);

  return (
    <div className="rounded-2xl border border-gray-100 bg-white shadow-sm
      hover:shadow-md transition-all duration-200 overflow-hidden">
      {/* Colored top bar */}
      <div className={`h-1.5 bg-gradient-to-r ${cfg.gradient}`} />

      {/* Topic header */}
      <div className="p-5 sm:p-6 pb-3">
        <div className="flex items-center gap-3">
          <span className={`inline-flex items-center justify-center rounded-xl p-2.5
            ${cfg.bg} text-white`}>
            <Icon className="h-5 w-5" />
          </span>
          <div>
            <h3 className="text-lg font-bold text-gray-900 capitalize">{topic.topic}</h3>
            <p className="text-sm text-gray-400">{topic.wordCount.toLocaleString()} từ</p>
          </div>
        </div>
      </div>

      {/* Word previews */}
      <div className="px-5 sm:px-6 pb-2">
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-gray-300" />
          </div>
        ) : (
          <div>{words.map(w => <WordPreviewRow key={w.id} word={w} />)}</div>
        )}
      </div>

      {/* View all */}
      <div className="px-5 sm:px-6 pb-5 pt-2">
        <button
          onClick={onViewAll}
          className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl
            text-sm font-semibold ${cfg.color} bg-gray-50 hover:bg-gray-100
            transition-colors`}
        >
          Xem t\u1ea5t c\u1ea3 {topic.wordCount.toLocaleString()} t\u1eeb
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

interface Props {
  selectedTopic: string | null;
  onSelectTopic: (topic: string | null) => void;
}

export function TopicBrowseTab({ selectedTopic, onSelectTopic }: Props) {
  const [topics, setTopics] = useState<TopicSummary[]>([]);
  const [loadingTopics, setLoadingTopics] = useState(true);

  useEffect(() => {
    getTopics()
      .then(setTopics)
      .catch(() => {})
      .finally(() => setLoadingTopics(false));
  }, []);

  if (selectedTopic) {
    const cfg = getTopicCfg(selectedTopic);
    const Icon = cfg.icon;
    return (
      <div className="space-y-5">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onSelectTopic(null)}
            className="gap-1.5 text-gray-500 hover:text-gray-700 rounded-xl"
          >
            <ChevronLeft className="h-4 w-4" />
            Quay lại
          </Button>
          <span className={`inline-flex items-center justify-center rounded-lg p-1.5
            ${cfg.bg} text-white`}>
            <Icon className="h-4 w-4" />
          </span>
          <span className="text-lg font-bold text-gray-800 capitalize">{selectedTopic}</span>
        </div>
        <CuratedWordListWithFilters topic={selectedTopic} />
      </div>
    );
  }

  if (loadingTopics) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
          Từ vựng theo Chủ đề
        </h2>
        <p className="text-sm text-gray-400 mt-1">
          Mỗi chủ đề hiển thị từ vựng mẫu. Nhấn &ldquo;Xem tất cả&rdquo; để xem đầy đủ.
        </p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {topics.map(t => (
          <TopicPreviewSection key={t.topic} topic={t} onViewAll={() => onSelectTopic(t.topic)} />
        ))}
      </div>
    </div>
  );
}
