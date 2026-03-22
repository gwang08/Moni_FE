'use client';

import { useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Trash2, MessageCircle, CornerDownRight } from 'lucide-react';
import type { StimulusRequest, QuestionRequest, QuestionTypeCode } from '@/types/admin.types';

interface Props {
  stimuli: StimulusRequest[];
  onChange: (stimuli: StimulusRequest[]) => void;
  onNext: () => void;
  onBack: () => void;
}

interface SpeakingQuestion {
  content: string;
  category: 'MAIN' | 'FOLLOW_UP';
  /** position of the MAIN question this follow-up belongs to (1-based) */
  parentPosition?: number;
}

interface PartData {
  title: string;
  transition: string;
  cueCard?: string;
  questions: SpeakingQuestion[];
}

const DEFAULT_TRANSITIONS = {
  2: "Now, I'm going to give you a topic and I'd like you to talk about it for one to two minutes. Before you talk, you'll have one minute to think about what you're going to say. Here is your topic.",
  3: "We've been talking about [topic]. Now, I'd like to discuss with you one or two more general questions related to this.",
};

function buildDefaultParts(): PartData[] {
  return [
    {
      title: 'Part 1',
      transition: '',
      questions: [{ content: '', category: 'MAIN' }],
    },
    {
      title: 'Part 2',
      transition: DEFAULT_TRANSITIONS[2],
      cueCard: '',
      questions: [],
    },
    {
      title: 'Part 3',
      transition: DEFAULT_TRANSITIONS[3],
      questions: [{ content: '', category: 'MAIN' }],
    },
  ];
}

/** Convert 3 PartData → 3 StimulusRequest for backend */
function partsToStimuli(parts: PartData[]): StimulusRequest[] {
  const typeCodeMap: Record<number, QuestionTypeCode> = {
    0: 'SPEAKING_PART_1',
    1: 'SPEAKING_PART_2',
    2: 'SPEAKING_PART_3',
  };

  return parts.map((part, partIdx) => {
    const questions: QuestionRequest[] = [];
    const section = partIdx + 1;

    // Transition script at position 0 (Part 2 & 3 only)
    if (section >= 2 && part.transition.trim()) {
      questions.push({
        content: part.transition,
        position: 0,
        questionCategory: 'MAIN',
        options: [],
      });
    }

    if (section === 2) {
      // Part 2: cue card at position 1
      if (part.cueCard?.trim()) {
        questions.push({
          content: part.cueCard,
          position: 1,
          questionCategory: 'MAIN',
          options: [],
        });
      }
    } else {
      // Part 1 & 3: MAIN + FOLLOW_UP questions
      let mainPosition = 0;
      for (const q of part.questions) {
        if (!q.content.trim()) continue;
        if (q.category === 'MAIN') {
          mainPosition++;
          questions.push({
            content: q.content,
            position: mainPosition,
            questionCategory: 'MAIN',
            options: [],
          });
        } else {
          questions.push({
            content: q.content,
            position: mainPosition + 1,
            questionCategory: 'FOLLOW_UP',
            parentQuestionPosition: q.parentPosition,
            options: [],
          });
          mainPosition++;
        }
      }
    }

    return {
      title: part.title,
      content: '',
      section,
      questionGroups: [{
        questionTypeCode: typeCodeMap[partIdx],
        instruction: part.title,
        questions,
      }],
    };
  });
}

/** Try to reverse-parse stimuli back into PartData (for draft restore) */
function stimuliToParts(stimuli: StimulusRequest[]): PartData[] | null {
  if (stimuli.length !== 3) return null;

  try {
    return stimuli.map((s, idx) => {
      const qs = s.questionGroups[0]?.questions || [];
      const section = idx + 1;

      const transition = qs.find(q => q.position === 0)?.content || '';
      const mainQs = qs.filter(q => (q.position ?? 0) > 0);

      if (section === 2) {
        const cueCard = mainQs.find(q => q.position === 1)?.content || '';
        return {
          title: s.title || `Part ${section}`,
          transition,
          cueCard,
          questions: [],
        };
      }

      const questions: SpeakingQuestion[] = mainQs.map(q => ({
        content: q.content,
        category: (q.questionCategory || 'MAIN') as 'MAIN' | 'FOLLOW_UP',
        parentPosition: q.parentQuestionPosition,
      }));

      return {
        title: s.title || `Part ${section}`,
        transition,
        questions: questions.length > 0 ? questions : [{ content: '', category: 'MAIN' as const }],
      };
    });
  } catch {
    return null;
  }
}

export function TestImportStep2Speaking({ stimuli, onChange, onNext, onBack }: Props) {
  const restored = stimuliToParts(stimuli);
  const [part1, part2, part3] = restored || buildDefaultParts();
  const parts: PartData[] = [part1, part2, part3];

  const sync = useCallback((updated: PartData[]) => {
    onChange(partsToStimuli(updated));
  }, [onChange]);

  // Initialize on mount if empty
  useEffect(() => {
    if (stimuli.length === 0) {
      sync(buildDefaultParts());
    }
  }, [stimuli.length, sync]);

  const updatePart = (partIdx: number, patch: Partial<PartData>) => {
    const updated = [...parts];
    updated[partIdx] = { ...updated[partIdx], ...patch };
    sync(updated);
  };

  const addQuestion = (partIdx: number, category: 'MAIN' | 'FOLLOW_UP' = 'MAIN', parentPos?: number) => {
    const updated = [...parts];
    const q: SpeakingQuestion = { content: '', category };
    if (category === 'FOLLOW_UP' && parentPos) q.parentPosition = parentPos;
    updated[partIdx] = { ...updated[partIdx], questions: [...updated[partIdx].questions, q] };
    sync(updated);
  };

  const updateQuestion = (partIdx: number, qIdx: number, patch: Partial<SpeakingQuestion>) => {
    const updated = [...parts];
    const qs = [...updated[partIdx].questions];
    qs[qIdx] = { ...qs[qIdx], ...patch };
    updated[partIdx] = { ...updated[partIdx], questions: qs };
    sync(updated);
  };

  const removeQuestion = (partIdx: number, qIdx: number) => {
    const updated = [...parts];
    updated[partIdx] = { ...updated[partIdx], questions: updated[partIdx].questions.filter((_, i) => i !== qIdx) };
    sync(updated);
  };

  /** Get the position number of the nearest MAIN question before qIdx */
  const getParentMainPosition = (partIdx: number, qIdx: number): number => {
    let mainPos = 0;
    for (let i = 0; i < qIdx; i++) {
      if (parts[partIdx].questions[i].category === 'MAIN') mainPos++;
    }
    return mainPos;
  };

  const hasContent = parts.some(p =>
    p.questions.some(q => q.content.trim()) || (p.cueCard?.trim())
  );

  return (
    <div className="space-y-6">
      {/* Part 1 */}
      <PartSection
        title="Part 1: Introduction & Interview"
        description="Câu hỏi quen thuộc về bản thân, sở thích, quê quán..."
        color="blue"
      >
        <QuestionList
          questions={parts[0].questions}
          partIdx={0}
          onAdd={addQuestion}
          onUpdate={updateQuestion}
          onRemove={removeQuestion}
          getParentMainPosition={getParentMainPosition}
          showFollowUp
        />
      </PartSection>

      {/* Part 2 */}
      <PartSection
        title="Part 2: Long Turn (Cue Card)"
        description="Thí sinh nói 1-2 phút về chủ đề cho sẵn"
        color="amber"
      >
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Câu dẫn chuyển (Transition Script)</label>
            <textarea
              value={parts[1].transition}
              onChange={(e) => updatePart(1, { transition: e.target.value })}
              rows={2}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 resize-y"
              placeholder="Now, I'm going to give you a topic..."
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Nội dung Cue Card</label>
            <textarea
              value={parts[1].cueCard || ''}
              onChange={(e) => updatePart(1, { cueCard: e.target.value })}
              rows={5}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 resize-y"
              placeholder={"Describe a memorable trip you took.\nYou should say:\n- where you went\n- who you went with\n- what you did there\nAnd explain why it was so memorable."}
            />
          </div>
        </div>
      </PartSection>

      {/* Part 3 */}
      <PartSection
        title="Part 3: Two-way Discussion"
        description="Câu hỏi thảo luận chuyên sâu liên quan đến chủ đề Part 2"
        color="emerald"
      >
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Câu dẫn chuyển (Transition Script)</label>
            <textarea
              value={parts[2].transition}
              onChange={(e) => updatePart(2, { transition: e.target.value })}
              rows={2}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-y"
              placeholder="We've been talking about [topic]..."
            />
          </div>
          <QuestionList
            questions={parts[2].questions}
            partIdx={2}
            onAdd={addQuestion}
            onUpdate={updateQuestion}
            onRemove={removeQuestion}
            getParentMainPosition={getParentMainPosition}
            showFollowUp
          />
        </div>
      </PartSection>

      <div className="flex justify-between pt-2">
        <Button variant="outline" onClick={onBack}>Quay lại</Button>
        <Button onClick={onNext} disabled={!hasContent}>Tiếp theo</Button>
      </div>
    </div>
  );
}

/* ── Sub-components ── */

function PartSection({ title, description, color, children }: {
  title: string;
  description: string;
  color: 'blue' | 'amber' | 'emerald';
  children: React.ReactNode;
}) {
  const borderColor = { blue: 'border-blue-200', amber: 'border-amber-200', emerald: 'border-emerald-200' }[color];
  const bgColor = { blue: 'bg-blue-50', amber: 'bg-amber-50', emerald: 'bg-emerald-50' }[color];
  const textColor = { blue: 'text-blue-700', amber: 'text-amber-700', emerald: 'text-emerald-700' }[color];

  return (
    <div className={`border ${borderColor} rounded-xl overflow-hidden`}>
      <div className={`${bgColor} px-4 py-3`}>
        <h3 className={`text-sm font-semibold ${textColor}`}>{title}</h3>
        <p className="text-xs text-gray-500 mt-0.5">{description}</p>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

function QuestionList({ questions, partIdx, onAdd, onUpdate, onRemove, getParentMainPosition, showFollowUp }: {
  questions: SpeakingQuestion[];
  partIdx: number;
  onAdd: (partIdx: number, category: 'MAIN' | 'FOLLOW_UP', parentPos?: number) => void;
  onUpdate: (partIdx: number, qIdx: number, patch: Partial<SpeakingQuestion>) => void;
  onRemove: (partIdx: number, qIdx: number) => void;
  getParentMainPosition: (partIdx: number, qIdx: number) => number;
  showFollowUp?: boolean;
}) {
  let mainCounter = 0;

  return (
    <div className="space-y-2">
      {questions.map((q, i) => {
        if (q.category === 'MAIN') mainCounter++;
        const currentMainPos = q.category === 'MAIN' ? mainCounter : q.parentPosition;
        const isFollowUp = q.category === 'FOLLOW_UP';

        return (
          <div key={i} className={`border border-gray-200 rounded-lg p-3 ${isFollowUp ? 'ml-8 border-dashed' : ''}`}>
            <div className="flex items-center gap-2">
              {isFollowUp ? (
                <span className="text-xs font-semibold text-purple-600 bg-purple-50 px-2 py-0.5 rounded shrink-0 flex items-center gap-1">
                  <CornerDownRight className="h-3 w-3" />
                  Follow-up
                </span>
              ) : (
                <span className="text-xs font-semibold text-orange-600 bg-orange-50 px-2 py-0.5 rounded shrink-0 flex items-center gap-1">
                  <MessageCircle className="h-3 w-3" />
                  Q{mainCounter}
                </span>
              )}
              <Input
                value={q.content}
                onChange={(e) => onUpdate(partIdx, i, { content: e.target.value })}
                placeholder={isFollowUp ? 'Câu hỏi mở rộng...' : 'Nhập câu hỏi chính...'}
                className="flex-1 h-8 text-sm"
              />
              <button type="button" onClick={() => onRemove(partIdx, i)} className="text-gray-300 hover:text-red-500 shrink-0">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
            {/* Add follow-up button after each MAIN question */}
            {showFollowUp && q.category === 'MAIN' && (
              <button
                type="button"
                onClick={() => onAdd(partIdx, 'FOLLOW_UP', currentMainPos)}
                className="mt-2 text-xs text-purple-500 hover:text-purple-700 flex items-center gap-1"
              >
                <CornerDownRight className="h-3 w-3" /> Thêm follow-up
              </button>
            )}
          </div>
        );
      })}

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="mt-2 gap-1"
        onClick={() => onAdd(partIdx, 'MAIN')}
      >
        <Plus className="h-3.5 w-3.5" /> Thêm câu hỏi chính
      </Button>
    </div>
  );
}
