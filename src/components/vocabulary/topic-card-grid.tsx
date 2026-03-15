'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import {
  Leaf, Cpu, HeartPulse, GraduationCap, Briefcase,
  FlaskConical, Plane, UtensilsCrossed, Users, Palette,
  BookText,
} from 'lucide-react';
import type { TopicSummary } from '@/types/vocab.types';
import type { LucideIcon } from 'lucide-react';

const TOPIC_CONFIG: Record<string, { icon: LucideIcon; gradient: string }> = {
  environment:  { icon: Leaf,            gradient: 'from-green-400 to-emerald-500' },
  technology:   { icon: Cpu,             gradient: 'from-blue-400 to-sky-500' },
  health:       { icon: HeartPulse,      gradient: 'from-rose-400 to-pink-500' },
  education:    { icon: GraduationCap,   gradient: 'from-indigo-400 to-blue-500' },
  business:     { icon: Briefcase,       gradient: 'from-amber-400 to-yellow-500' },
  science:      { icon: FlaskConical,    gradient: 'from-purple-400 to-violet-500' },
  travel:       { icon: Plane,           gradient: 'from-sky-400 to-cyan-500' },
  food:         { icon: UtensilsCrossed, gradient: 'from-orange-400 to-amber-500' },
  society:      { icon: Users,           gradient: 'from-teal-400 to-cyan-500' },
  arts:         { icon: Palette,         gradient: 'from-pink-400 to-rose-500' },
};

const DEFAULT_CFG = { icon: BookText, gradient: 'from-gray-400 to-gray-500' };

const T = {
  words: 't\u1eeb v\u1ef1ng',
  view: 'Xem t\u1eeb v\u1ef1ng',
};

export function TopicCardGrid({ topics }: { topics: TopicSummary[] }) {
  if (topics.length === 0) return null;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {topics.map(topic => {
        const cfg = TOPIC_CONFIG[topic.topic.toLowerCase()] ?? DEFAULT_CFG;
        const Icon = cfg.icon;
        return (
          <Link
            key={topic.topic}
            href={`/vocabulary/topic/${topic.topic}`}
            className="group rounded-xl overflow-hidden border border-gray-100 bg-white
              shadow-sm hover:shadow-md transition-all duration-200"
          >
            <div className={`h-20 sm:h-24 bg-gradient-to-br ${cfg.gradient}
              flex items-center justify-center`}>
              <Icon className="h-10 w-10 text-white/90" />
            </div>
            <div className="p-3 sm:p-4">
              <p className="text-sm font-bold text-gray-900 capitalize">{topic.topic}</p>
              <p className="text-xs text-gray-400 mt-0.5">
                {topic.wordCount.toLocaleString()} {T.words}
              </p>
              <div className="flex items-center gap-1 mt-2 text-xs font-semibold text-indigo-600
                group-hover:text-indigo-700 transition-colors">
                {T.view}
                <ChevronRight className="h-3.5 w-3.5" />
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
