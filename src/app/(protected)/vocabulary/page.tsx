'use client';

import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { DictionarySearchTab } from '@/components/vocabulary/dictionary-search-tab';
import { BandBrowseTab } from '@/components/vocabulary/band-browse-tab';
import { TopicBrowseTab } from '@/components/vocabulary/topic-browse-tab';
import { MyNotebookTab } from '@/components/vocabulary/my-notebook-tab';

export default function VocabularyPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Từ Vựng</h1>
        <p className="text-gray-500 mt-1">Tra từ điển, khám phá từ vựng theo band và chủ đề</p>
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
