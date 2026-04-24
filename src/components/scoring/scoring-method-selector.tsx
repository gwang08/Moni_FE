'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Bot, GraduationCap, Zap, Video } from 'lucide-react';

interface ScoringMethodSelectorProps {
  onSelectAI: () => void;
  onSelectExpert: () => void;
  skill: 'writing' | 'speaking';
}

export function ScoringMethodSelector({
  onSelectAI,
  onSelectExpert,
  skill,
}: ScoringMethodSelectorProps) {
  return (
    <div className="flex flex-col gap-3 w-full">
      <p className="text-sm text-muted-foreground text-center">Chọn phương thức chấm điểm</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* AI Scoring */}
        <Card className="p-5 flex flex-col gap-3 border-2 hover:border-emerald-400/60 transition-colors cursor-pointer group">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <Bot className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold text-sm">Chấm bằng AI</p>
              <Badge variant="secondary" className="text-xs mt-0.5">
                <Zap className="h-3 w-3 mr-1" />
                Tức thì
              </Badge>
            </div>
          </div>

          <p className="text-xs text-muted-foreground flex-1">
            {skill === 'writing'
              ? 'Phân tích Task Response, Coherence, Vocabulary, Grammar theo tiêu chí IELTS.'
              : 'Phân tích Fluency, Vocabulary, Grammar, Pronunciation theo tiêu chí IELTS.'}
          </p>

          <Button
            onClick={onSelectAI}
            size="sm"
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            Chọn AI
          </Button>
        </Card>

        {/* Expert Scoring */}
        <Card className="p-5 flex flex-col gap-3 border-2 hover:border-amber-400/60 transition-colors cursor-pointer group">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-100 text-amber-600">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold text-sm">Chấm với Giảng viên</p>
              <Badge variant="secondary" className="text-xs mt-0.5 bg-amber-100 text-amber-700">
                <Video className="h-3 w-3 mr-1" />
                Live call
              </Badge>
            </div>
          </div>

          <p className="text-xs text-muted-foreground flex-1">
            Được chấm điểm trực tiếp bởi giảng viên có kinh nghiệm qua video call.
          </p>

          <Button
            onClick={onSelectExpert}
            size="sm"
            className="w-full bg-amber-500 hover:bg-amber-600 text-white border-0"
          >
            Chọn Giảng viên
          </Button>
        </Card>
      </div>
    </div>
  );
}
