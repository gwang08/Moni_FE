'use client';

import Link from 'next/link';
import Image from 'next/image';
import { BookOpen } from 'lucide-react';
import type { TopicSummary } from '@/types/vocab.types';

const TOPIC_IMG: Record<string, string> = {
  animals: '/vocab/topic-animals.jpg',
  plants: '/vocab/topic-plants.jpg',
  environment: '/vocab/topic-environment.jpg',
  technology: '/vocab/topic-technology.jpg',
  health: '/vocab/topic-health.jpg',
  education: '/vocab/topic-education.jpg',
  travel: '/vocab/topic-travel.jpg',
  food: '/vocab/topic-food.jpg',
  business: '/vocab/topic-business.jpg',
  science: '/vocab/topic-science.jpg',
  sports: '/vocab/topic-sports.jpg',
  arts: '/vocab/topic-arts.jpg',
  media: '/vocab/topic-media.jpg',
  law: '/vocab/topic-law.jpg',
  politics: '/vocab/topic-politics.jpg',
  society: '/vocab/topic-society.jpg',
  weather: '/vocab/topic-weather.jpg',
  family: '/vocab/topic-family.jpg',
};

const T = {
  cta: 'B\u1eaft \u0111\u1ea7u H\u1ecdc',
  cards: 'th\u1ebb',
};

function TopicDeckCard({ topic }: { topic: TopicSummary }) {
  const img = TOPIC_IMG[topic.topic.toLowerCase()] ?? '/vocab/topic-education.jpg';

  return (
    <Link
      href={`/vocabulary/topic/${encodeURIComponent(topic.topic)}`}
      className="group block rounded-lg border border-gray-200 bg-white
        hover:shadow-lg transition-all duration-300"
    >
      <div className="p-4">
        {/* Thumbnail */}
        <div className="w-full h-44 mb-3 rounded-lg overflow-hidden bg-gray-100 relative">
          <Image
            src={img}
            alt={topic.topic}
            fill
            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
          />
        </div>

        {/* Title */}
        <div className="mb-3">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <p className="font-semibold text-[16px] leading-[20px] line-clamp-2 capitalize">
                {topic.topic}
              </p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
          <div className="flex items-center gap-1">
            <BookOpen className="h-4 w-4" />
            <span>{topic.wordCount.toLocaleString()} {T.cards}</span>
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

export function TopicDeckCards({ topics }: { topics: TopicSummary[] }) {
  if (topics.length === 0) return null;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {topics.map(t => <TopicDeckCard key={t.topic} topic={t} />)}
    </div>
  );
}
