'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useCallback, Suspense } from 'react';
import Link from 'next/link';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { DictionarySearchTab } from '@/components/vocabulary/dictionary-search-tab';
import { BandBrowseTab } from '@/components/vocabulary/band-browse-tab';
import { TopicBrowseTab } from '@/components/vocabulary/topic-browse-tab';
import { MyNotebookTab } from '@/components/vocabulary/my-notebook-tab';
import { Zap, HelpCircle, Puzzle, Search, BookOpen, Tag, Notebook } from 'lucide-react';
import { ChibiMascot, ChibiAnimationStyles } from '@/components/ui/chibi-mascot';

const LEARNING_METHODS = [
  {
    href: '/vocabulary/flashcard',
    icon: Zap,
    label: 'Flashcard',
    description: 'Ôn tập với thẻ lật',
    color: 'text-blue-600',
    iconBg: 'bg-blue-100',
    border: 'border-blue-100 hover:border-blue-300',
  },
  {
    href: '/vocabulary/quiz',
    icon: HelpCircle,
    label: 'Trắc nghiệm',
    description: 'Kiểm tra kiến thức',
    color: 'text-emerald-600',
    iconBg: 'bg-emerald-100',
    border: 'border-emerald-100 hover:border-emerald-300',
  },
  {
    href: '/vocabulary/word-match',
    icon: Puzzle,
    label: 'Nối từ',
    description: 'Ghép từ với nghĩa',
    color: 'text-purple-600',
    iconBg: 'bg-purple-100',
    border: 'border-purple-100 hover:border-purple-300',
  },
];

const TAB_ICONS = {
  dictionary: Search,
  band: BookOpen,
  topic: Tag,
  notebook: Notebook,
};

function VocabularyContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const tab = searchParams.get('tab') || 'dictionary';
  const band = searchParams.get('band');
  const topic = searchParams.get('topic');

  const updateParams = useCallback((updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value === null || value === '') {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    }
    const str = params.toString();
    router.replace(`/vocabulary${str ? `?${str}` : ''}`, { scroll: false });
  }, [searchParams, router]);

  const handleTabChange = (value: string) => {
    if (value === 'dictionary') {
      router.replace('/vocabulary', { scroll: false });
    } else {
      router.replace(`/vocabulary?tab=${value}`, { scroll: false });
    }
  };

  const handleSelectBand = (b: string | null) => {
    if (b) {
      updateParams({ tab: 'band', band: b, topic: null });
    } else {
      updateParams({ band: null });
    }
  };

  const handleSelectTopic = (t: string | null) => {
    if (t) {
      updateParams({ tab: 'topic', topic: t, band: null });
    } else {
      updateParams({ topic: null });
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      <ChibiAnimationStyles />

      {/* Hero section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 border border-blue-100 p-6 sm:p-8">
        <div className="flex items-center gap-5">
          <ChibiMascot mood="happy" size={72} />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Từ Vựng IELTS</h1>
            <p className="text-gray-500 mt-1 text-sm">
              Tra từ điển, khám phá từ vựng theo band &amp; chủ đề, luyện tập mỗi ngày
            </p>
          </div>
        </div>

        {/* Learning method cards */}
        <div className="mt-6 grid grid-cols-3 gap-3">
          {LEARNING_METHODS.map(({ href, icon: Icon, label, description, color, iconBg, border }) => (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 rounded-xl border bg-white/80 backdrop-blur-sm p-3 sm:p-4
                transition-all duration-200 hover:shadow-md ${border}`}
            >
              <span className={`shrink-0 inline-flex items-center justify-center rounded-lg p-2 ${iconBg}`}>
                <Icon className={`h-5 w-5 ${color}`} />
              </span>
              <div className="min-w-0">
                <p className={`text-sm font-semibold ${color}`}>{label}</p>
                <p className="text-xs text-gray-500 hidden sm:block">{description}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="w-full justify-start mb-6 bg-gray-100/70 p-1 rounded-xl h-auto flex-wrap gap-0.5">
          {([
            ['dictionary', 'Tra từ điển'],
            ['band', 'Theo Band'],
            ['topic', 'Theo Chủ đề'],
            ['notebook', 'Sổ tay của tôi'],
          ] as const).map(([value, label]) => {
            const Icon = TAB_ICONS[value];
            return (
              <TabsTrigger
                key={value}
                value={value}
                className="gap-1.5 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm px-4 py-2"
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{label}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        <TabsContent value="dictionary">
          <DictionarySearchTab />
        </TabsContent>

        <TabsContent value="band">
          <BandBrowseTab selectedBand={band} onSelectBand={handleSelectBand} />
        </TabsContent>

        <TabsContent value="topic">
          <TopicBrowseTab selectedTopic={topic} onSelectTopic={handleSelectTopic} />
        </TabsContent>

        <TabsContent value="notebook">
          <MyNotebookTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function VocabularyPage() {
  return (
    <Suspense>
      <VocabularyContent />
    </Suspense>
  );
}
