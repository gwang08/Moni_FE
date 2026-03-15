'use client';

import Link from 'next/link';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { DictionarySearchTab } from '@/components/vocabulary/dictionary-search-tab';
import { BandBrowseTab } from '@/components/vocabulary/band-browse-tab';
import { TopicBrowseTab } from '@/components/vocabulary/topic-browse-tab';
import { MyNotebookTab } from '@/components/vocabulary/my-notebook-tab';
import { Zap, HelpCircle, Puzzle } from 'lucide-react';

const LEARNING_METHODS = [
  {
    href: '/vocabulary/flashcard',
    icon: Zap,
    label: 'Flashcard',
    description: 'Ôn tập với thẻ lật',
    color: 'text-blue-600',
    bg: 'bg-blue-50 hover:bg-blue-100 border-blue-200',
  },
  {
    href: '/vocabulary/quiz',
    icon: HelpCircle,
    label: 'Trắc nghiệm',
    description: 'Kiểm tra kiến thức',
    color: 'text-green-600',
    bg: 'bg-green-50 hover:bg-green-100 border-green-200',
  },
  {
    href: '/vocabulary/word-match',
    icon: Puzzle,
    label: 'Nối từ',
    description: 'Ghép từ với nghĩa',
    color: 'text-purple-600',
    bg: 'bg-purple-50 hover:bg-purple-100 border-purple-200',
  },
];

export default function VocabularyPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Từ Vựng</h1>
        <p className="text-gray-500 mt-1">Tra từ điển, khám phá từ vựng theo band và chủ đề</p>
      </div>

      {/* Learning methods */}
      <div className="mb-8">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Phương pháp học
        </h2>
        <div className="grid grid-cols-3 gap-3">
          {LEARNING_METHODS.map(({ href, icon: Icon, label, description, color, bg }) => (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-2 rounded-xl border p-4 transition-colors ${bg}`}
            >
              <Icon className={`h-6 w-6 ${color}`} />
              <div className="text-center">
                <p className={`text-sm font-semibold ${color}`}>{label}</p>
                <p className="text-xs text-gray-500 mt-0.5">{description}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <Tabs defaultValue="dictionary" className="w-full">
        <TabsList className="w-full justify-start mb-6 flex-wrap h-auto gap-1">
          <TabsTrigger value="dictionary">Tra từ điển</TabsTrigger>
          <TabsTrigger value="band">Theo Band</TabsTrigger>
          <TabsTrigger value="topic">Theo Chủ đề</TabsTrigger>
          <TabsTrigger value="notebook">Sổ tay của tôi</TabsTrigger>
        </TabsList>

        <TabsContent value="dictionary">
          <DictionarySearchTab />
        </TabsContent>

        <TabsContent value="band">
          <BandBrowseTab />
        </TabsContent>

        <TabsContent value="topic">
          <TopicBrowseTab />
        </TabsContent>

        <TabsContent value="notebook">
          <MyNotebookTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
