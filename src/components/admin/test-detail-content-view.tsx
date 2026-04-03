'use client';

import { useMemo, useState } from 'react';
import { formatReadingPassage } from '@/lib/format-reading-passage';
import { ReadingQuestionsPanel } from '@/components/reading/reading-questions-panel';
import type { StimulusDetail, TestDetailResponse } from '@/types/test.types';

interface Props {
  test: TestDetailResponse;
}

function TranscriptBlock({ stimulus }: { stimulus: StimulusDetail }) {
  const transcriptText = useMemo(() => {
    if (stimulus.transcript?.length) {
      return stimulus.transcript
        .map((line) => `${line.speaker ? `${line.speaker}: ` : ''}${line.text}`)
        .join('\n');
    }
    return '';
  }, [stimulus.transcript]);

  if (!stimulus.mediaUrl && !transcriptText) return null;

  return (
    <div className="rounded-lg border border-purple-200 bg-purple-50 p-3 space-y-2">
      {stimulus.mediaUrl && (
        <audio controls src={stimulus.mediaUrl} className="h-8 w-full" />
      )}
      {transcriptText && (
        <div className="rounded-md border border-purple-100 bg-white px-3 py-2 text-sm text-gray-700 whitespace-pre-wrap">
          {transcriptText}
        </div>
      )}
    </div>
  );
}

export function TestDetailContentView({ test }: Props) {
  const [activeStimulus, setActiveStimulus] = useState(0);
  const stimulus = test.stimuli[activeStimulus];

  if (!stimulus) {
    return <p className="py-8 text-center text-gray-400">Chưa có nội dung</p>;
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-3 overflow-hidden">
      {test.stimuli.length > 1 && (
        <div className="flex shrink-0 flex-wrap gap-1">
          {test.stimuli.map((item, index) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveStimulus(index)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                index === activeStimulus ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {item.title || `Passage ${index + 1}`}
            </button>
          ))}
        </div>
      )}

      <div className="flex min-h-0 flex-1 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <section className="flex min-h-0 shrink-0 flex-col overflow-hidden border-r border-gray-200 bg-slate-50/70" style={{ flexBasis: '46%' }}>
          <div className="shrink-0 border-b border-gray-200 bg-white/90 px-4 py-3 backdrop-blur">
            <h4 className="text-sm font-semibold text-gray-800">{stimulus.title || (test.skill === 'LISTENING' ? 'Bài nghe' : 'Bài đọc')}</h4>
            <p className="text-xs text-gray-500">{test.skill === 'LISTENING' ? 'Transcript / audio' : 'Passage for comparison'}</p>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 [scrollbar-gutter:stable]">
            {test.skill === 'LISTENING' && <TranscriptBlock stimulus={stimulus} />}

            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <h4 className="text-sm font-semibold text-gray-700">Passage / Transcript</h4>
                <div className="text-xs text-gray-400">{stimulus.questionGroups.reduce((sum, g) => sum + g.questions.length, 0)} câu</div>
              </div>

              <div
                className="max-h-none overflow-y-auto rounded-lg border border-gray-300 bg-white px-5 py-4 text-sm leading-relaxed select-text prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: formatReadingPassage(stimulus.content || '<p class="text-gray-400 italic">Chưa có nội dung đề bài.</p>') }}
              />
            </div>
          </div>
        </section>

        <section className="flex min-h-0 flex-1 flex-col overflow-hidden bg-white">
          <div className="shrink-0 border-b border-gray-200 bg-white/95 px-4 py-3 backdrop-blur">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-gray-800">Question flow</h3>
                <p className="text-xs text-gray-500">
                  {stimulus.questionGroups.reduce((sum, g) => sum + g.questions.length, 0)} questions across {stimulus.questionGroups.length} groups
                </p>
              </div>
            </div>
          </div>

          <div className="shrink-0 border-b border-gray-200 bg-slate-50 px-4 py-3">
            <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-gutter:stable]">
              {stimulus.questionGroups.map((group, index) => (
                <button
                  key={group.id}
                  type="button"
                  onClick={() => {
                    const el = document.getElementById(`group-${group.id}`);
                    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                  className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                    index === 0 ? 'border-blue-600 bg-blue-600 text-white' : 'border-gray-200 bg-white text-gray-600 hover:border-blue-300 hover:text-blue-700'
                  }`}
                >
                  <span>{`Group ${index + 1}`}</span>
                  <span className={`rounded-full px-1.5 py-0.5 text-[10px] ${index === 0 ? 'bg-white/20' : 'bg-gray-100 text-gray-500'}`}>
                    {group.questions.length}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 [scrollbar-gutter:stable]">
            <ReadingQuestionsPanel
              stimulus={stimulus}
              submitted={false}
              answers={{}}
              onAnswer={() => {}}
              textAnswers={{}}
              onTextAnswer={() => {}}
            />
          </div>
        </section>
      </div>
    </div>
  );
}
