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
  part: number;
}

interface SpeakingQuestion {
  content: string;
  category: 'MAIN' | 'FOLLOW_UP';
  parentPosition?: number;
}

interface PartData {
  title: string;
  transition: string;
  cueCard?: string;
  questions: SpeakingQuestion[];
}

const DEFAULT_TRANSITIONS: Record<number, string> = {
  2: "Now, I'm going to give you a topic and I'd like you to talk about it for one to two minutes. Before you talk, you'll have one minute to think about what you're going to say. Here is your topic.",
  3: "We've been talking about [topic]. Now, I'd like to discuss with you one or two more general questions related to this.",
};

function getQuestionTypeCode(part: number): QuestionTypeCode {
  if (part === 2) return 'SPEAKING_PART_2';
  if (part === 3) return 'SPEAKING_PART_3';
  return 'SPEAKING_PART_1';
}

function buildDefaultPart(part: number): PartData {
  if (part === 2) {
    return {
      title: 'Part 2',
      transition: DEFAULT_TRANSITIONS[2],
      cueCard: '',
      questions: [],
    };
  }

  if (part === 3) {
    return {
      title: 'Part 3',
      transition: DEFAULT_TRANSITIONS[3],
      questions: [{ content: '', category: 'MAIN' }],
    };
  }

  return {
    title: 'Part 1',
    transition: '',
    questions: [{ content: '', category: 'MAIN' }],
  };
}

function stimulusToPart(stimulus: StimulusRequest | undefined, part: number): PartData {
  const fallback = buildDefaultPart(part);
  if (!stimulus) return fallback;

  const qs = stimulus.questionGroups[0]?.questions || [];
  const transition = qs.find((q) => q.position === 0)?.content || '';
  const mainQs = qs.filter((q) => (q.position ?? 0) > 0);

  if (part === 2) {
    return {
      title: stimulus.title || 'Part 2',
      transition,
      cueCard: mainQs.find((q) => q.position === 1)?.content || '',
      questions: [],
    };
  }

  const questions: SpeakingQuestion[] = mainQs.map((q) => ({
    content: q.content,
    category: (q.questionCategory || 'MAIN') as 'MAIN' | 'FOLLOW_UP',
    parentPosition: q.parentQuestionPosition,
  }));

  return {
    title: stimulus.title || fallback.title,
    transition,
    questions: questions.length > 0 ? questions : fallback.questions,
  };
}

function partToStimulus(part: PartData, partNumber: number): StimulusRequest {
  const questions: QuestionRequest[] = [];

  if (partNumber >= 2 && part.transition.trim()) {
    questions.push({
      content: part.transition,
      position: 0,
      questionCategory: 'MAIN',
      options: [],
    });
  }

  if (partNumber === 2) {
    if (part.cueCard?.trim()) {
      questions.push({
        content: part.cueCard,
        position: 1,
        questionCategory: 'MAIN',
        options: [],
      });
    }
  } else {
    let mainPosition = 0;
    for (const q of part.questions) {
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
    section: partNumber,
    questionGroups: [
      {
        questionTypeCode: getQuestionTypeCode(partNumber),
        instruction: part.title,
        questions,
      },
    ],
  };
}

export function TestImportStep2Speaking({ stimuli, onChange, onNext, onBack, part }: Props) {
  const normalizedPart = Math.min(3, Math.max(1, part || 1));

  const sync = useCallback(
    (updated: PartData) => {
      onChange([partToStimulus(updated, normalizedPart)]);
    },
    [normalizedPart, onChange]
  );

  useEffect(() => {
    const current = stimuli[0];
    if (!current || current.section !== normalizedPart || current.questionGroups[0]?.questionTypeCode !== getQuestionTypeCode(normalizedPart)) {
      sync(buildDefaultPart(normalizedPart));
    }
  }, [normalizedPart, stimuli, sync]);

  const currentPart = stimulusToPart(stimuli[0], normalizedPart);
  const updatePart = (patch: Partial<PartData>) => {
    sync({ ...currentPart, ...patch });
  };

  const addQuestion = (category: 'MAIN' | 'FOLLOW_UP' = 'MAIN', parentPos?: number) => {
    const q: SpeakingQuestion = { content: '', category };
    if (category === 'FOLLOW_UP' && parentPos) q.parentPosition = parentPos;
    updatePart({ questions: [...currentPart.questions, q] });
  };

  const updateQuestion = (qIdx: number, patch: Partial<SpeakingQuestion>) => {
    const qs = [...currentPart.questions];
    qs[qIdx] = { ...qs[qIdx], ...patch };
    updatePart({ questions: qs });
  };

  const removeQuestion = (qIdx: number) => {
    updatePart({
      questions: currentPart.questions.filter((_, i) => i !== qIdx),
    });
  };

  const hasContent =
    currentPart.questions.some((q) => q.content.trim()) ||
    (currentPart.cueCard?.trim() ?? '') !== '' ||
    currentPart.transition.trim() !== '';

  return (
    <div className="space-y-6">
      <PartSection
        title={`Part ${normalizedPart}`}
        description="Tạo đúng part đã chọn ở bước trước."
        color={normalizedPart === 2 ? 'amber' : normalizedPart === 3 ? 'emerald' : 'blue'}
      >
        {normalizedPart === 2 ? (
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">Transition Script</label>
              <textarea
                value={currentPart.transition}
                onChange={(e) => updatePart({ transition: e.target.value })}
                rows={2}
                className="w-full resize-y rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                placeholder="Now, I'm going to give you a topic..."
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">Cue Card Content</label>
              <textarea
                value={currentPart.cueCard || ''}
                onChange={(e) => updatePart({ cueCard: e.target.value })}
                rows={5}
                className="w-full resize-y rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                placeholder={"Describe a memorable trip you took.\nYou should say:\n- where you went\n- who you went with\n- what you did there\nAnd explain why it was so memorable."}
              />
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {normalizedPart === 3 && (
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500">Transition Script</label>
                <textarea
                  value={currentPart.transition}
                  onChange={(e) => updatePart({ transition: e.target.value })}
                  rows={2}
                  className="w-full resize-y rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="We've been talking about [topic]..."
                />
              </div>
            )}
            <QuestionList
              questions={currentPart.questions}
              onAdd={addQuestion}
              onUpdate={updateQuestion}
              onRemove={removeQuestion}
              showFollowUp
            />
          </div>
        )}
      </PartSection>

      <div className="flex justify-between pt-2">
        <Button variant="outline" onClick={onBack}>
          Quay lại
        </Button>
        <Button onClick={onNext} disabled={!hasContent}>
          Tiếp theo
        </Button>
      </div>
    </div>
  );
}

/* Sub-components */

function PartSection({
  title,
  description,
  color,
  children,
}: {
  title: string;
  description: string;
  color: 'blue' | 'amber' | 'emerald';
  children: React.ReactNode;
}) {
  const borderColor = { blue: 'border-blue-200', amber: 'border-amber-200', emerald: 'border-emerald-200' }[color];
  const bgColor = { blue: 'bg-blue-50', amber: 'bg-amber-50', emerald: 'bg-emerald-50' }[color];
  const textColor = { blue: 'text-blue-700', amber: 'text-amber-700', emerald: 'text-emerald-700' }[color];

  return (
    <div className={`overflow-hidden rounded-xl border ${borderColor}`}>
      <div className={`${bgColor} px-4 py-3`}>
        <h3 className={`text-sm font-semibold ${textColor}`}>{title}</h3>
        <p className="mt-0.5 text-xs text-gray-500">{description}</p>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

function QuestionList({
  questions,
  onAdd,
  onUpdate,
  onRemove,
  showFollowUp,
}: {
  questions: SpeakingQuestion[];
  onAdd: (category: 'MAIN' | 'FOLLOW_UP', parentPos?: number) => void;
  onUpdate: (qIdx: number, patch: Partial<SpeakingQuestion>) => void;
  onRemove: (qIdx: number) => void;
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
          <div key={i} className={`rounded-lg border border-gray-200 p-3 ${isFollowUp ? 'ml-8 border-dashed' : ''}`}>
            <div className="flex items-center gap-2">
              {isFollowUp ? (
                <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-purple-50 px-2 py-0.5 text-xs font-semibold text-purple-600">
                  <CornerDownRight className="h-3 w-3" />
                  Follow-up
                </span>
              ) : (
                <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-orange-50 px-2 py-0.5 text-xs font-semibold text-orange-600">
                  <MessageCircle className="h-3 w-3" />
                  Q{mainCounter}
                </span>
              )}
              <Input
                value={q.content}
                onChange={(e) => onUpdate(i, { content: e.target.value })}
                placeholder={isFollowUp ? 'Follow-up question...' : 'Enter main question...'}
                className="h-8 flex-1 text-sm"
              />
              <button type="button" onClick={() => onRemove(i)} className="shrink-0 text-gray-300 hover:text-red-500">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>

            {showFollowUp && q.category === 'MAIN' && (
              <button
                type="button"
                onClick={() => onAdd('FOLLOW_UP', currentMainPos)}
                className="mt-2 flex items-center gap-1 text-xs text-purple-500 hover:text-purple-700"
              >
                <CornerDownRight className="h-3 w-3" /> Add follow-up
              </button>
            )}
          </div>
        );
      })}

      <Button type="button" variant="outline" size="sm" className="mt-2 gap-1" onClick={() => onAdd('MAIN')}>
        <Plus className="h-3.5 w-3.5" /> Add main question
      </Button>
    </div>
  );
}
