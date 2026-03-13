'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Image as ImageIcon } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import type { StimulusDetail } from '@/types/test.types';

interface Props {
  stimuli: StimulusDetail[];
}

export function TestDetailWritingView({ stimuli }: Props) {
  const [zoomImage, setZoomImage] = useState<string | null>(null);
  const [showSample, setShowSample] = useState(false);
  const s = stimuli[0];
  if (!s) return <p className="text-gray-400 text-center py-8">Chưa có nội dung</p>;

  const sampleAnswer = s.questionGroups[0]?.instruction;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
      <h3 className="text-sm font-semibold text-gray-700">Đề bài Writing</h3>
      {s.content ? (
        <div className="text-sm text-gray-700 bg-gray-50 rounded-lg p-4 prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: s.content }} />
      ) : (
        <div className="text-sm text-gray-400 italic bg-gray-50 rounded-lg p-4">Chưa nhập đề bài</div>
      )}

      {s.mediaUrl && (
        <div>
          <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
            <ImageIcon className="h-3.5 w-3.5" /> Biểu đồ (Task 1)
          </p>
          <img
            src={s.mediaUrl}
            alt="Chart"
            className="max-h-64 rounded-lg border border-gray-200 cursor-pointer hover:opacity-90 transition-opacity"
            onClick={() => setZoomImage(s.mediaUrl!)}
          />
        </div>
      )}

      {sampleAnswer && (
        <div>
          <button
            type="button"
            onClick={() => setShowSample(!showSample)}
            className="flex items-center gap-1 text-xs font-medium text-green-600 hover:text-green-700"
          >
            {showSample ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            Bài mẫu
          </button>
          {showSample && (
            <div className="mt-2 text-sm text-gray-600 bg-green-50 rounded-lg p-4 border border-green-200 space-y-2">
              {sampleAnswer.includes('---SECTION---') ? (
                sampleAnswer.split('\n---SECTION---\n').map((section, idx) => {
                  if (!section.trim()) return null;
                  const labels = ['Introduction', 'Overview', 'Body 1', 'Body 2'];
                  return (
                    <div key={idx}>
                      <p className="text-xs font-bold text-green-700 mb-0.5">{labels[idx] || `Phần ${idx + 1}`}</p>
                      <p className="whitespace-pre-wrap">{section.trim()}</p>
                    </div>
                  );
                })
              ) : (
                <p className="whitespace-pre-wrap">{sampleAnswer}</p>
              )}
            </div>
          )}
        </div>
      )}

      <Dialog open={!!zoomImage} onOpenChange={() => setZoomImage(null)}>
        <DialogContent className="max-w-4xl">
          {zoomImage && <img src={zoomImage} alt="Chart zoom" className="w-full rounded-lg" />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
