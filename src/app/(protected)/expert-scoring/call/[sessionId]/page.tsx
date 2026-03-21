'use client';

// TODO: Replace video placeholder with Daily.co embed when ready.
// Integration steps:
//   1. Install @daily-co/daily-js: `npm install @daily-co/daily-js`
//   2. Fetch roomUrl from ScoringSession data
//   3. Call DailyIframe.createFrame() with the roomUrl
//   4. Mount the iframe in the #daily-container div

import { use } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Video, ArrowLeft } from 'lucide-react';

interface Props {
  params: Promise<{ sessionId: string }>;
}

export default function ExpertCallPage({ params }: Props) {
  const { sessionId } = use(params);
  const router = useRouter();

  return (
    <div className="min-h-[calc(100vh-56px)] bg-gray-900 text-white flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
        <Button
          variant="ghost"
          size="sm"
          className="text-gray-300 hover:text-white"
          onClick={() => router.push('/expert-scoring')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Thoát
        </Button>
        <div className="flex items-center gap-2">
          <Badge variant="destructive" className="animate-pulse">
            LIVE
          </Badge>
          <span className="text-sm text-gray-300">Phiên #{sessionId}</span>
        </div>
      </div>

      {/* Video area */}
      <div className="flex-1 flex items-center justify-center p-6">
        <Card className="bg-gray-800 border-gray-600 p-10 text-center max-w-lg w-full space-y-4">
          <div className="flex items-center justify-center">
            <div className="p-5 rounded-full bg-gray-700">
              <Video className="h-10 w-10 text-gray-400" />
            </div>
          </div>

          <div>
            <p className="text-lg font-semibold text-white">
              Video call đang được kết nối...
            </p>
            <p className="text-sm text-gray-400 mt-2">
              Tích hợp Daily.co sẽ được thêm vào sớm
            </p>
          </div>

          {/* Placeholder for Daily.co iframe */}
          <div id="daily-container" className="w-full h-48 rounded-lg bg-gray-700 flex items-center justify-center">
            <p className="text-xs text-gray-500">Daily.co iframe placeholder</p>
          </div>

          <p className="text-xs text-gray-500">
            Khi giảng viên tham gia, video call sẽ bắt đầu tự động
          </p>
        </Card>
      </div>
    </div>
  );
}
