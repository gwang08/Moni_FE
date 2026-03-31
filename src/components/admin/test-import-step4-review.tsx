'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle2, FileText, MessageSquare, Eye, ListChecks } from 'lucide-react';
import type { StimulusRequest } from '@/types/admin.types';
import { type BasicInfo, SKILL_SECTIONS } from '@/components/admin/test-import-step1-basic-info';
import { SpeakingExamPreview } from '@/components/admin/speaking-exam-preview';

const TYPE_LABELS: Record<string, string> = {
  MCQ: 'Trắc nghiệm (MCQ)',
  TFNG: 'True / False / Not Given',
  YNNG: 'Yes / No / Not Given',
  MATCHING: 'Nối đáp án',
  FILL_IN_THE_BLANK: 'Điền từ vào chỗ trống',
  SHORT_ANSWER: 'Trả lời ngắn',
};

interface Props {
  basicInfo: BasicInfo;
  stimuli: StimulusRequest[];
  submitting: boolean;
  error: string;
  onSubmit: () => void;
  onBack: () => void;
}

function WritingReview({ stimuli }: { stimuli: StimulusRequest[] }) {
  const s = stimuli[0];
  if (!s) return null;
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <div className="bg-gray-50 px-4 py-2.5 border-b border-gray-200">
        <span className="text-sm font-semibold text-gray-700">Đề bài Writing</span>
      </div>
      <div className="p-4 space-y-3">
        {s.content ? (
          <div className="text-sm text-gray-700 prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: s.content }} />
        ) : (
          <p className="text-red-400 italic text-sm">Chưa nhập đề bài</p>
        )}
        {s.questionGroups[0]?.instruction && (
          <div>
            <p className="text-xs text-gray-500 mb-1">Bài mẫu:</p>
            <div className="text-sm text-gray-600 bg-green-50 rounded-lg p-3 space-y-2">
              {s.questionGroups[0].instruction.includes('---SECTION---') ? (
                s.questionGroups[0].instruction.split('\n---SECTION---\n').map((section, idx) => {
                  if (!section.trim()) return null;
                  const labels = ['Introduction', 'Overview', 'Body 1', 'Body 2'];
                  return (
                    <div key={idx}>
                      <p className="text-[11px] font-bold text-green-700 mb-0.5">{labels[idx] || `Phần ${idx + 1}`}</p>
                      <p className="whitespace-pre-wrap">{section.trim()}</p>
                    </div>
                  );
                })
              ) : (
                <p className="whitespace-pre-wrap">{s.questionGroups[0].instruction}</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SpeakingReview({ stimuli }: { stimuli: StimulusRequest[] }) {
  if (stimuli.length === 0) return null;

  const partColors = [
    { border: 'border-blue-200', bg: 'bg-blue-50', text: 'text-blue-700' },
    { border: 'border-amber-200', bg: 'bg-amber-50', text: 'text-amber-700' },
    { border: 'border-emerald-200', bg: 'bg-emerald-50', text: 'text-emerald-700' },
  ];

  return (
    <div className="space-y-4">
      {stimuli.map((s, si) => {
        const questions = s.questionGroups[0]?.questions || [];
        const transition = questions.find(q => q.position === 0);
        const mainQuestions = questions.filter(q => (q.position ?? 0) > 0);
        const color = partColors[si] || partColors[0];

        return (
          <div key={si} className={`border ${color.border} rounded-lg overflow-hidden`}>
            <div className={`${color.bg} px-4 py-2.5 border-b ${color.border} flex items-center justify-between`}>
              <span className={`text-sm font-semibold ${color.text}`}>{s.title || `Part ${si + 1}`}</span>
              <span className="text-xs text-gray-400">{mainQuestions.length} câu</span>
            </div>
            <div className="p-4 space-y-3">
              {/* Transition script */}
              {transition && (
                <div className="bg-gray-50 rounded-lg p-3 border border-dashed border-gray-300">
                  <p className="text-[11px] font-semibold text-gray-500 uppercase mb-1">Câu dẫn chuyển</p>
                  <p className="text-sm text-gray-600 italic">{transition.content}</p>
                </div>
              )}

              {/* Part 2: Cue Card */}
              {si === 1 && mainQuestions.length > 0 && (
                <div className="bg-amber-50 rounded-lg p-3 border border-amber-200">
                  <p className="text-[11px] font-semibold text-amber-600 uppercase mb-1">Cue Card</p>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{mainQuestions[0].content}</p>
                </div>
              )}

              {/* Part 1 & 3: MAIN + FOLLOW_UP questions */}
              {si !== 1 && mainQuestions.map((q, qi) => {
                const isFollowUp = q.questionCategory === 'FOLLOW_UP';
                return (
                  <div
                    key={qi}
                    className={`border-l-2 pl-3 py-1 ${isFollowUp ? 'border-purple-300 ml-6' : 'border-orange-300'}`}
                  >
                    <p className="text-sm">
                      <span className={`text-xs font-semibold px-1.5 py-0.5 rounded mr-1.5 ${
                        isFollowUp ? 'text-purple-600 bg-purple-50' : 'text-orange-600 bg-orange-50'
                      }`}>
                        {isFollowUp ? 'Follow-up' : `Q${q.position}`}
                      </span>
                      {q.content}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ListeningReview({ stimuli }: { stimuli: StimulusRequest[] }) {
  const s = stimuli[0];
  if (!s) return null;
  return (
    <>
      {s.mediaUrl && (
        <div className="flex items-center gap-2 bg-purple-50 border border-purple-200 rounded-lg p-3 mb-4">
          <span className="text-xs font-medium text-purple-700">Audio:</span>
          <audio controls src={s.mediaUrl} className="h-8 flex-1" />
        </div>
      )}
    </>
  );
}

export function TestImportStep4({ basicInfo, stimuli, submitting, error, onSubmit, onBack }: Props) {
  const [speakingTab, setSpeakingTab] = useState<'summary' | 'preview'>('summary');
  const isSpeaking = basicInfo.skill === 'SPEAKING';

  const totalQuestions = stimuli.reduce(
    (sum, s) => sum + s.questionGroups.reduce((gs, g) => gs + g.questions.length, 0), 0
  );
  const totalGroups = stimuli.reduce((sum, s) => sum + s.questionGroups.length, 0);

  const sectionLabel = basicInfo.section && basicInfo.skill
    ? SKILL_SECTIONS[basicInfo.skill]?.find(s => s.value === basicInfo.section)?.label
    : null;

  return (
    <div className="space-y-5">
      {/* Summary */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-blue-800 mb-2">Tóm tắt bài thi</h3>
        <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
          <p><span className="text-gray-500">Tiêu đề:</span> <span className="font-medium">{basicInfo.title}</span></p>
          <p><span className="text-gray-500">Kỹ năng:</span> <span className="font-medium">{basicInfo.skill}</span></p>
          <p><span className="text-gray-500">Loại bài:</span> <span className="font-medium">Bài lẻ{sectionLabel ? ` — ${sectionLabel}` : ''}</span></p>
          {basicInfo.thumbnailUrl && (
            <p><span className="text-gray-500">Ảnh bìa:</span> <span className="font-medium">Đã tải lên</span></p>
          )}
          <p><span className="text-gray-500">{isSpeaking ? 'Số Part:' : 'Số passage:'}</span> {stimuli.length}</p>
          <p><span className="text-gray-500">Tổng nhóm:</span> {totalGroups}</p>
          <p><span className="text-gray-500">Tổng câu hỏi:</span> <span className="font-semibold text-blue-700">{totalQuestions}</span></p>
        </div>
      </div>

      {/* Speaking tabs: Summary / Preview */}
      {isSpeaking && (
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          <button
            type="button"
            onClick={() => setSpeakingTab('summary')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-medium rounded-md transition-colors cursor-pointer ${
              speakingTab === 'summary' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <ListChecks className="h-4 w-4" /> Tóm tắt nội dung
          </button>
          <button
            type="button"
            onClick={() => setSpeakingTab('preview')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-medium rounded-md transition-colors cursor-pointer ${
              speakingTab === 'preview' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Eye className="h-4 w-4" /> Xem trước phòng thi
          </button>
        </div>
      )}

      {/* Skill-specific review */}
      {basicInfo.skill === 'WRITING' && <WritingReview stimuli={stimuli} />}
      {isSpeaking && speakingTab === 'summary' && <SpeakingReview stimuli={stimuli} />}
      {isSpeaking && speakingTab === 'preview' && <SpeakingExamPreview stimuli={stimuli} />}
      {basicInfo.skill === 'LISTENING' && <ListeningReview stimuli={stimuli} />}

      {/* Per stimulus detail (Reading/Listening question groups) */}
      {(basicInfo.skill === 'READING' || basicInfo.skill === 'LISTENING' || !basicInfo.skill) && stimuli.map((s, si) => (
        <div key={si} className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="bg-gray-50 px-4 py-2.5 flex items-center gap-2 border-b border-gray-200">
            <FileText className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-semibold text-gray-700">Passage {si + 1}</span>
            <span className="text-xs text-gray-400 ml-auto">
              {s.questionGroups.length} nhóm · {s.questionGroups.reduce((sum, g) => sum + g.questions.length, 0)} câu
            </span>
          </div>

          <div className="p-4 space-y-4">
            {s.questionGroups.map((g, gi) => {
              const positionOffset = s.questionGroups.slice(0, gi).reduce((sum, prev) => sum + prev.questions.length, 0);
              return (
                <div key={gi} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                      Nhóm {gi + 1}: {TYPE_LABELS[g.questionTypeCode] ?? g.questionTypeCode}
                    </span>
                    <span className="text-xs text-gray-400">{g.questions.length} câu</span>
                  </div>
                  {g.instruction && (
                    <p className="text-xs text-gray-500 italic ml-2">{g.instruction}</p>
                  )}

                  {g.questions.map((q, qi) => {
                    return (
                      <div key={qi} className="ml-2 border-l-2 border-gray-200 pl-3 py-1.5 space-y-1">
                        <p className="text-sm">
                          <span className="font-medium text-gray-700">Câu {positionOffset + qi + 1}.</span>{' '}
                          {q.content || <span className="text-red-400 italic">Chưa nhập nội dung</span>}
                        </p>

                        {/* Options */}
                        <div className="flex flex-wrap gap-x-4 gap-y-0.5">
                          {q.options.map((o, oi) => (
                            <span key={oi} className={`text-xs ${o.isCorrect ? 'text-green-700 font-semibold' : 'text-gray-500'}`}>
                              {o.isCorrect && <CheckCircle2 className="h-3 w-3 inline mr-0.5 -mt-0.5" />}
                              {o.label ? `${o.label}. ` : ''}{o.content}
                            </span>
                          ))}
                        </div>

                        {/* Explanation & evidence */}
                        {(q.explanation?.text || q.explanation?.evidence) && (
                          <div className="flex gap-3 mt-1">
                            {q.explanation.text && (
                              <p className="text-xs text-gray-500">
                                <MessageSquare className="h-3 w-3 inline mr-0.5 -mt-0.5" />
                                {q.explanation.text}
                              </p>
                            )}
                            {q.explanation.evidence && (
                              <p className="text-xs text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded max-w-sm truncate">
                                &ldquo;{q.explanation.evidence.replace(/\n---\n/g, ' | ')}&rdquo;
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <div className="flex justify-between pt-2">
        <Button variant="outline" onClick={onBack}>Quay lại</Button>
        <Button onClick={onSubmit} disabled={submitting}>
          {submitting ? <><Loader2 className="h-4 w-4 animate-spin mr-1" /> Đang tạo...</> : 'Tạo bài thi'}
        </Button>
      </div>
    </div>
  );
}
