'use client';

import { X, BookOpen, Headphones, PenLine, Mic, CheckCircle2, XCircle, Hash } from 'lucide-react';
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

// Unified emerald theme — brand color is green. Header gradient is the same across skills.
const SKILL_META: Record<SkillKey, { label: string; icon: typeof BookOpen }> = {
  reading:   { label: 'Reading',   icon: BookOpen },
  listening: { label: 'Listening', icon: Headphones },
  writing:   { label: 'Writing',   icon: PenLine },
  speaking:  { label: 'Speaking',  icon: Mic },
};

const HEADER_GRADIENT = 'from-emerald-500 to-teal-600';

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
  // Single brand color (emerald), with a softer shade for low scores
  const color = band >= 5 ? 'bg-emerald-500' : 'bg-emerald-300';
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

  const correctCount = skill === 'reading' ? result.readingCorrect : skill === 'listening' ? result.listeningCorrect : null;

  // Build question review for R/L
  const questionReview = (skill === 'reading' || skill === 'listening') && testDetail
    ? buildQuestionReview(testDetail, userAnswers || {}, userTextAnswers || {})
    : null;

  const totalQ = questionReview?.length || 0;
  const correctQ = questionReview?.filter(q => q.isCorrect).length || 0;
  const incorrectQ = totalQ - correctQ;

  const criteria = skill === 'writing' ? result.writingCriteria : skill === 'speaking' ? result.speakingCriteria : null;
  const criteriaLabels = skill === 'writing' ? WRITING_CRITERIA_LABELS : SPEAKING_CRITERIA_LABELS;

  return (
    // Sit BELOW the sticky navbar (h-14 = 56px) so header never covers the modal top.
    <div className="fixed inset-x-0 top-14 bottom-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm overflow-y-auto py-6 px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden my-auto">

        {/* Header — unified emerald gradient (brand color) */}
        <div className={`relative bg-gradient-to-br ${HEADER_GRADIENT} px-6 pt-5 pb-6 text-white`}>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-lg bg-white/20 hover:bg-white/30 transition-colors"
          >
            <X className="h-4 w-4 text-white" />
          </button>

          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <Icon className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold">{meta.label}</h3>
              <p className="text-xs text-white/70">Chi tiết kết quả chấm điểm</p>
            </div>
          </div>

          {/* Band score + stats row */}
          <div className="flex items-end justify-between">
            <div className="flex items-baseline gap-1.5">
              <span className="text-5xl font-extrabold">{band.toFixed(1)}</span>
              <span className="text-lg text-white/60 font-medium">/ 9.0</span>
            </div>

            {/* R/L stats */}
            {correctCount !== null && (
              <div className="flex items-center gap-3">
                <div className="text-center">
                  <div className="text-2xl font-bold">{correctCount}</div>
                  <div className="text-[10px] text-white/60 uppercase tracking-wider">Đúng</div>
                </div>
                <div className="w-px h-8 bg-white/20" />
                <div className="text-center">
                  <div className="text-2xl font-bold">{totalQ}</div>
                  <div className="text-[10px] text-white/60 uppercase tracking-wider">Tổng</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Body */}
        <div className="max-h-[55vh] overflow-y-auto">

          {/* R/L: Summary bar */}
          {questionReview && totalQ > 0 && (
            <div className="px-6 py-4 border-b border-gray-100">
              {/* Progress bar */}
              <div className="flex items-center gap-3 mb-2">
                <div className="flex-1 bg-gray-100 rounded-full h-2.5 overflow-hidden flex">
                  <div
                    className="h-full bg-emerald-500 transition-all duration-500"
                    style={{ width: `${(correctQ / totalQ) * 100}%` }}
                  />
                  <div
                    className="h-full bg-red-400 transition-all duration-500"
                    style={{ width: `${(incorrectQ / totalQ) * 100}%` }}
                  />
                </div>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <span className="flex items-center gap-1.5 text-emerald-600 font-semibold">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  {correctQ} đúng
                </span>
                <span className="flex items-center gap-1.5 text-red-500 font-semibold">
                  <span className="w-2 h-2 rounded-full bg-red-400" />
                  {incorrectQ} sai
                </span>
              </div>
            </div>
          )}

          {/* W/S: AI Criteria breakdown */}
          {criteria && Object.keys(criteria).length > 0 && (
            <div className="px-6 py-5 space-y-4">
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Điểm theo tiêu chí</h4>
              {Object.entries(criteria).map(([key, value]) => (
                <BandBar key={key} label={criteriaLabels[key] || key} band={value} />
              ))}
            </div>
          )}

          {/* W/S: No criteria available */}
          {(skill === 'writing' || skill === 'speaking') && (!criteria || Object.keys(criteria).length === 0) && (
            <div className="px-6 py-8 text-center">
              <p className="text-sm text-gray-400">Không có dữ liệu chi tiết cho kỹ năng này.</p>
            </div>
          )}

          {/* R/L: Question review list */}
          {questionReview && questionReview.length > 0 && (
            <div className="px-6 py-4">
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                Chi tiết từng câu
              </h4>
              <div className="space-y-2">
                {questionReview.map((q, idx) => (
                  <div
                    key={q.id}
                    className={`rounded-xl border overflow-hidden ${
                      q.isCorrect ? 'border-emerald-100' : 'border-red-100'
                    }`}
                  >
                    {/* Question header */}
                    <div className={`flex items-center gap-2.5 px-4 py-2.5 ${
                      q.isCorrect ? 'bg-emerald-50/60' : 'bg-red-50/60'
                    }`}>
                      <div className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold ${
                        q.isCorrect ? 'bg-emerald-500' : 'bg-red-400'
                      }`}>
                        {q.isCorrect ? '✓' : '✗'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-xs text-gray-400 font-mono">Q{idx + 1}</span>
                        {q.content && (
                          <span className="text-sm text-gray-700 ml-2 font-medium">{q.content}</span>
                        )}
                      </div>
                    </div>

                    {/* Answer details */}
                    <div className="px-4 py-2.5 bg-white space-y-1">
                      {/* User's answer */}
                      <div className="flex items-start gap-2">
                        <span className={`text-[11px] font-semibold uppercase tracking-wider mt-0.5 shrink-0 w-16 ${
                          q.isCorrect ? 'text-emerald-500' : 'text-red-400'
                        }`}>
                          Bạn chọn
                        </span>
                        <span className={`text-sm ${q.isCorrect ? 'text-emerald-700' : 'text-red-600'}`}>
                          {q.userAnswer}
                        </span>
                      </div>
                      {/* Correct answer (only if wrong) */}
                      {!q.isCorrect && q.correctAnswer && (
                        <div className="flex items-start gap-2">
                          <span className="text-[11px] font-semibold uppercase tracking-wider mt-0.5 shrink-0 w-16 text-emerald-500">
                            Đáp án
                          </span>
                          <span className="text-sm text-emerald-700 font-medium">
                            {q.correctAnswer}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-gray-900 hover:bg-gray-800 text-white text-sm font-semibold transition-colors"
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
