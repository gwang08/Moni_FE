'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DailyVideoCall } from '@/components/video/daily-video-call';
import { getQueuePosition } from '@/lib/expert-api';
import { ArrowLeft, Loader2 } from 'lucide-react';

interface Props {
  params: Promise<{ sessionId: string }>;
}

export default function ExpertCallPage({ params }: Props) {
  const { sessionId } = use(params);
  const router = useRouter();
  const [roomUrl, setRoomUrl] = useState('');
  const [loading, setLoading] = useState(true);

  // Fetch session to get roomUrl
  useEffect(() => {
    const fetchRoom = async () => {
      try {
        const data = await getQueuePosition(Number(sessionId));
        if (data.roomUrl) setRoomUrl(data.roomUrl);
      } catch { /* ignore */ }
      setLoading(false);
    };
    fetchRoom();
    // Poll for roomUrl if not available yet
    const id = setInterval(async () => {
      try {
        const data = await getQueuePosition(Number(sessionId));
        if (data.roomUrl) {
          setRoomUrl(data.roomUrl);
          clearInterval(id);
        }
        if (data.status === 'COMPLETED' || data.status === 'CANCELLED') {
          clearInterval(id);
          router.push('/expert-scoring');
        }
      } catch { /* ignore */ }
    }, 3000);
    return () => clearInterval(id);
  }, [sessionId, router]);

  return (
    <div className="h-[calc(100vh-56px)] bg-gray-900 text-white flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700 shrink-0">
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
      <div className="flex-1 p-4">
        {loading ? (
          <div className="h-full flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : (
          <DailyVideoCall
            roomUrl={roomUrl}
            onLeave={() => router.push('/expert-scoring')}
            className="h-full"
          />
        )}
      </div>
    </div>
  );
}
