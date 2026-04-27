'use client';

import { X, BookOpen, Headphones, PenLine, Mic, CheckCircle2, XCircle } from 'lucide-react';
import type { PlacementResult } from '@/types/placement.types';
import type { TestDetailResponse } from '@/types/test.types';

type SkillKey = 'reading' | 'listening' | 'writing' | 'speaking';

interface Props {
  skill: SkillKey;
  result: PlacementResult;
  testDetail?: TestDetailResponse;
  userAnswers?: Record<number, number>;
  userTextAnswers?: Record<number, string>;
  onClose: () => void;
}

const SKILL_META: Record<SkillKey, { label: string; icon: typeof BookOpen; color: string; bg: string; border: string }> = {
  reading: { label: 'Reading', icon: BookOpen, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
  listening: { label: 'Listening', icon: Headphones, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200' },
  writing: { label: 'Writing', icon: PenLine, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  speaking: { label: 'Speaking', icon: Mic, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200' },
};

const WRITING_CRITERIA_LABELS: Record<string, string> = {
  TA: 'Task Achievement',
  TR: 'Task Response',
  CC: 'Coherence & Cohesion',
  LR: 'Lexical Resource',
  GRA: 'Grammatical Range & Accuracy',
};

const SPEAKING_CRITERIA_LABELS: Record<string, string> = {
  FC: 'Fluency & Coherence',
  LR: 'Lexical Resource',
  GRA: 'Grammatical Range & Accuracy',
  PR: 'Pronunciation',
};

function BandBar({ label, band, maxBand = 9 }: { label: string; band: number; maxBand?: number }) {
  const pct = (band / maxBand) * 100;
  const color = band >= 7 ? 'bg-teal-500' : band >= 5 ? 'bg-blue-500' : band >= 3 ? 'bg-orange-500' : 'bg-red-400';
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-700 font-medium">{label}</span>
        <span className="text-sm font-bold text-gray-900">{band.toFixed(1)}</span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-700 ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function SkillDetailModal({ skill, result, testDetail, userAnswers, userTextAnswers, onClose }: Props) {
  const meta = SKILL_META[skill];
  const Icon = meta.icon;

  const band =
    skill === 'reading' ? result.readingBand
    : skill === 'listening' ? result.listeningBand
    : skill === 'writing' ? result.writingBand
    : result.speakingBand;

  // Build question review for R/L
  const questionReview = (skill === 'reading' || skill === 'listening') && testDetail
    ? buildQuestionReview(testDetail, userAnswers || {}, userTextAnswers || {})
    : null;

  const criteria = skill === 'writing' ? result.writingCriteria : skill === 'speaking' ? result.speakingCriteria : null;
  const criteriaLabels = skill === 'writing' ? WRITING_CRITERIA_LABELS : SPEAKING_CRITERIA_LABELS;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 backdrop-blur-sm overflow-y-auto py-8">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
        {/* Header */}
        <div className={`relative px-6 py-5 ${meta.bg} border-b ${meta.border}`}>
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-teal-400 to-emerald-500" />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl ${meta.bg} border ${meta.border} flex items-center justify-center`}>
                <Icon className={`h-5 w-5 ${meta.color}`} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">{meta.label}</h3>
                <p className="text-xs text-gray-500">Chi tiết kết quả chấm điểm</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-white/60 transition-colors"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>
          {/* Band score */}
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-4xl font-extrabold text-gray-900">{band.toFixed(1)}</span>
            <span className="text-sm text-gray-500">/ 9.0</span>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5 max-h-[60vh] overflow-y-auto space-y-5">

          {/* R/L: Correct count */}
          {(skill === 'reading' || skill === 'listening') && (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
              <CheckCircle2 className="h-5 w-5 text-teal-500" />
              <span className="text-sm text-gray-700">
                Số câu đúng:{' '}
                <span className="font-bold text-gray-900">
                  {skill === 'reading' ? result.readingCorrect : result.listeningCorrect}
                </span>
              </span>
            </div>
          )}

          {/* W/S: AI Criteria breakdown */}
          {criteria && Object.keys(criteria).length > 0 && (
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Điểm theo tiêu chí</h4>
              {Object.entries(criteria).map(([key, value]) => (
                <BandBar key={key} label={criteriaLabels[key] || key} band={value} />
              ))}
            </div>
          )}

          {/* W/S: No criteria available */}
          {(skill === 'writing' || skill === 'speaking') && (!criteria || Object.keys(criteria).length === 0) && (
            <p className="text-sm text-gray-400 text-center py-4">
              Không có dữ liệu chi tiết cho kỹ năng này.
            </p>
          )}

          {/* R/L: Question review */}
          {questionReview && questionReview.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wider">
                Chi tiết câu hỏi ({questionReview.filter(q => q.isCorrect).length}/{questionReview.length} đúng)
              </h4>
              <div className="space-y-2">
                {questionReview.map((q, idx) => (
                  <div
                    key={q.id}
                    className={`flex items-start gap-3 px-3 py-2.5 rounded-xl border text-sm ${
                      q.isCorrect
                        ? 'bg-green-50/50 border-green-100'
                        : 'bg-red-50/50 border-red-100'
                    }`}
                  >
                    <div className="shrink-0 mt-0.5">
                      {q.isCorrect ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-gray-500 font-mono text-xs">Q{idx + 1}.</span>{' '}
                      <span className="text-gray-700">{q.content || `Câu ${idx + 1}`}</span>
                      {!q.isCorrect && q.correctAnswer && (
                        <p className="text-xs text-green-600 mt-0.5">
                          Đáp án: {q.correctAnswer}
                        </p>
                      )}
                      {q.userAnswer && (
                        <p className={`text-xs mt-0.5 ${q.isCorrect ? 'text-green-600' : 'text-red-500'}`}>
                          Bạn chọn: {q.userAnswer}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-sm font-semibold text-gray-700 transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}

// Build question review from test detail and user answers
interface QuestionReviewItem {
  id: number;
  content: string;
  isCorrect: boolean;
  correctAnswer: string;
  userAnswer: string;
}

function buildQuestionReview(
  testDetail: TestDetailResponse,
  userAnswers: Record<number, number>,
  userTextAnswers: Record<number, string>
): QuestionReviewItem[] {
  const items: QuestionReviewItem[] = [];

  for (const stimulus of testDetail.stimuli || []) {
    for (const group of stimulus.questionGroups || []) {
      for (const question of group.questions || []) {
        const correctOpt = question.options?.find((o) => o.isCorrect);
        const selectedOptId = userAnswers[question.id];
        const selectedOpt = question.options?.find((o) => o.id === selectedOptId);
        const textAnswer = userTextAnswers[question.id];

        let isCorrect = false;
        let userAnswer = '';

        if (selectedOpt) {
          isCorrect = selectedOpt.isCorrect;
          userAnswer = selectedOpt.label
            ? `${selectedOpt.label}. ${selectedOpt.content || ''}`
            : selectedOpt.content || '';
        } else if (textAnswer) {
          isCorrect = correctOpt
            ? textAnswer.trim().toLowerCase() === (correctOpt.content || '').trim().toLowerCase()
            : false;
          userAnswer = textAnswer;
        }

        items.push({
          id: question.id,
          content: question.content || '',
          isCorrect,
          correctAnswer: correctOpt
            ? correctOpt.label
              ? `${correctOpt.label}. ${correctOpt.content || ''}`
              : correctOpt.content || ''
            : '',
          userAnswer: userAnswer || '(Chưa trả lời)',
        });
      }
    }
  }

  return items;
}
