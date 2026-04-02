'use client';

import { Fragment, useCallback, useEffect, useRef, useState } from 'react';
import { GripVertical, Loader2, Music, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MediaUploadZone } from '@/components/admin/media-upload-zone';
import { StimulusCard } from '@/components/admin/test-import-stimulus-card';
import { QuestionGroupEditor } from '@/components/admin/test-import-question-group-editor';
import { transcribeByUrl } from '@/lib/admin-api';
import type { OptionRequest, QuestionGroupRequest, QuestionRequest, StimulusRequest, QuestionTypeCode } from '@/types/admin.types';

interface Props {
  skill: string;
  stimuli: StimulusRequest[];
  onChange: (stimuli: StimulusRequest[]) => void;
  onNext: () => void;
  onBack: () => void;
}

const emptyGroup = (): QuestionGroupRequest => ({
  questionTypeCode: 'MCQ',
  instruction: 'Choose the correct letter A, B, C or D.',
  questions: [],
});

const emptyStimulus = (): StimulusRequest => ({
  title: '',
  content: '',
  mediaUrl: undefined,
  section: 1,
  questionGroups: [emptyGroup()],
});

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

function moveItem<T>(items: T[], from: number, to: number): T[] {
  if (from === to) return items;
  const next = [...items];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

function getGroupTypeLabel(group: QuestionGroupRequest) {
  switch (group.questionTypeCode) {
    case 'MCQ':
      return 'Single Choice';
    case 'MCQ_MULTIPLE':
      return 'Multiple Choice';
    case 'TFNG':
      return 'True / False / Not Given';
    case 'YNNG':
      return 'Yes / No / Not Given';
    case 'MATCHING_HEADINGS':
      return 'Matching Headings';
    case 'MATCHING_INFORMATION':
      return 'Matching Information';
    case 'MATCHING_FEATURE':
      return 'Matching Features';
    case 'DIAGRAM_LABEL':
      return 'Diagram Label';
    case 'GAP_FILLING':
      return 'Gap Filling';
    default:
      return 'Question Group';
  }
}

function isGroupIncomplete(group: QuestionGroupRequest) {
  if (!group.questions.length) return true;
  return group.questions.some((question) => {
    const hasContent = question.content.trim().length > 0;
    const hasCorrect = question.options.some((option) => option.isCorrect && option.content.trim().length > 0);
    return !hasContent || !hasCorrect;
  });
}

function segmentsToHtml(segments: { text: string; speaker?: string }[]): string {
  return segments
    .map((seg) => {
      const speaker = seg.speaker ? `<strong>${seg.speaker}:</strong> ` : '';
      return `<p>${speaker}${seg.text}</p>`;
    })
    .join('');
}

function getListeningTranscriptStatus(skill: string, stimulus: StimulusRequest | undefined) {
  if (skill !== 'LISTENING') return null;
  if (stimulus?.mediaUrl) return 'Audio đã tải lên';
  return 'Upload audio để tự tạo transcript';
}

function getDefaultQuestionOptions(typeCode: QuestionTypeCode): OptionRequest[] {
  switch (typeCode) {
    case 'MCQ':
    case 'MCQ_MULTIPLE':
      return [
        { label: 'A', content: '', isCorrect: false },
        { label: 'B', content: '', isCorrect: false },
        { label: 'C', content: '', isCorrect: false },
        { label: 'D', content: '', isCorrect: false },
      ];
    case 'TFNG':
      return [
        { label: 'True', content: 'True', isCorrect: false },
        { label: 'False', content: 'False', isCorrect: false },
        { label: 'Not Given', content: 'Not Given', isCorrect: false },
      ];
    case 'YNNG':
      return [
        { label: 'Yes', content: 'Yes', isCorrect: false },
        { label: 'No', content: 'No', isCorrect: false },
        { label: 'Not Given', content: 'Not Given', isCorrect: false },
      ];
    case 'GAP_FILLING':
    case 'DIAGRAM_LABEL':
      return [{ label: '', content: '', isCorrect: true }];
    default:
      return [];
  }
}

function createDefaultQuestion(typeCode: QuestionTypeCode): QuestionRequest {
  return {
    content: '',
    options: getDefaultQuestionOptions(typeCode),
  };
}

export function TestImportStep3({ skill, stimuli, onChange, onNext, onBack }: Props) {
  const [activeStimulus, setActiveStimulus] = useState(0);
  const [showValidationDetails, setShowValidationDetails] = useState(false);
  const [leftWidth, setLeftWidth] = useState(40);
  const [isResizing, setIsResizing] = useState(false);
  const [activeGroupIndex, setActiveGroupIndex] = useState(0);
  const [dragGroupIndex, setDragGroupIndex] = useState<number | null>(null);
  const [groupDropIndex, setGroupDropIndex] = useState<number | null>(null);
  const [transcribing, setTranscribing] = useState(false);

  const layoutRef = useRef<HTMLDivElement>(null);
  const questionScrollRef = useRef<HTMLDivElement>(null);
  const groupRefs = useRef<Record<number, HTMLDivElement | null>>({});

  const stimulus = stimuli[activeStimulus];
  const sectionLabel = stimulus?.title?.trim() || (stimulus?.section ? `Phần ${stimulus.section}` : `Phần ${activeStimulus + 1}`);

  useEffect(() => {
    if (stimuli.length === 0) {
      onChange([emptyStimulus()]);
    }
  }, [onChange, stimuli.length]);

  const updateStimulus = useCallback(
    (fn: (s: StimulusRequest) => StimulusRequest) => {
      onChange(stimuli.map((item, index) => (index === activeStimulus ? fn(item) : item)));
    },
    [activeStimulus, onChange, stimuli]
  );

  const addQuestionToFocusedGroup = useCallback(() => {
    const groupIndex = activeGroupIndex;
    const questionIndex = stimuli[activeStimulus]?.questionGroups[groupIndex]?.questions.length ?? 0;

    updateStimulus((s) => {
      const questionGroups = [...s.questionGroups];
      const group = questionGroups[groupIndex];
      if (!group) return s;

      questionGroups[groupIndex] = {
        ...group,
        questions: [...group.questions, createDefaultQuestion(group.questionTypeCode)],
      };

      return {
        ...s,
        questionGroups,
      };
    });

    const nextKey = `${groupIndex}:${questionIndex}`;
    setActiveQuestionKey(nextKey);
    window.requestAnimationFrame(() => {
      const container = questionScrollRef.current;
      const target = container?.querySelector<HTMLElement>(`[data-question-key="${nextKey}"]`);
      target?.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
    });
  }, [activeGroupIndex, activeStimulus, stimuli, updateStimulus]);

  const handleListeningUpload = useCallback(
    async (url: string) => {
      setTranscribing(true);
      try {
        const segments = await transcribeByUrl(url);
        onChange(
          stimuli.map((item, index) =>
            index === activeStimulus
              ? { ...item, mediaUrl: url, content: segmentsToHtml(segments) }
              : item
          )
        );
      } catch {
        onChange(
          stimuli.map((item, index) =>
            index === activeStimulus
              ? { ...item, mediaUrl: url }
              : item
          )
        );
      } finally {
        setTranscribing(false);
      }
    },
    [activeStimulus, onChange, stimuli]
  );

  const addGroup = () => {
    updateStimulus((s) => ({ ...s, questionGroups: [...s.questionGroups, emptyGroup()] }));
  };

  const removeGroup = (groupIndex: number) => {
    updateStimulus((s) => ({
      ...s,
      questionGroups: s.questionGroups.filter((_, index) => index !== groupIndex),
    }));
  };

  const updateGroup = (groupIndex: number, updated: QuestionGroupRequest) => {
    updateStimulus((s) => ({
      ...s,
      questionGroups: s.questionGroups.map((group, index) => (index === groupIndex ? updated : group)),
    }));
  };

  const reorderGroups = (from: number, to: number) => {
    updateStimulus((s) => ({ ...s, questionGroups: moveItem(s.questionGroups, from, to) }));
  };

  const getPositionOffset = (groupIndex: number): number => {
    let offset = 0;
    for (let index = 0; index < groupIndex; index += 1) {
      offset += stimulus.questionGroups[index].questions.length;
    }
    return offset;
  };

  useEffect(() => {
    if (!isResizing) return;

    const handleMove = (event: PointerEvent) => {
      const container = layoutRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const nextWidth = ((event.clientX - rect.left) / rect.width) * 100;
      setLeftWidth(clamp(nextWidth, 30, 60));
    };

    const stopResize = () => setIsResizing(false);

    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', stopResize);
    window.addEventListener('pointercancel', stopResize);
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'col-resize';

    return () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', stopResize);
      window.removeEventListener('pointercancel', stopResize);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };
  }, [isResizing]);

  useEffect(() => {
    const root = questionScrollRef.current;
    if (!root || !stimulus) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const active = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (!active) return;

        const groupIndex = Number((active.target as HTMLElement).dataset.groupIndex);
        if (!Number.isNaN(groupIndex)) {
          setActiveGroupIndex(groupIndex);
        }
      },
      {
        root,
        threshold: [0.2, 0.4, 0.6, 0.8],
        rootMargin: '-10% 0px -65% 0px',
      }
    );

    stimulus.questionGroups.forEach((_, index) => {
      const el = groupRefs.current[index];
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [stimulus]);

  const handleGroupTabClick = (groupIndex: number) => {
    const el = groupRefs.current[groupIndex];
    if (!el) return;
    setActiveGroupIndex(groupIndex);
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const beginGroupDrag = (groupIndex: number) => {
    setDragGroupIndex(groupIndex);
    setGroupDropIndex(groupIndex);
  };

  const finishGroupDrag = () => {
    setDragGroupIndex(null);
    setGroupDropIndex(null);
  };

  const isValid = stimuli.every(
    (s) =>
      s.questionGroups.length > 0 &&
      s.questionGroups.every(
        (g) =>
          g.questions.length > 0 &&
          g.questions.every((q) => {
            const hasAnswer = q.options.some((o) => o.isCorrect && o.content.trim());
            if (g.questionTypeCode === 'GAP_FILLING' && g.groupContent?.trim()) return hasAnswer;
            return q.content.trim() && q.options.some((o) => o.isCorrect);
          })
      )
  );

  if (!stimulus) {
    return (
      <div className="flex h-[calc(100vh-220px)] min-h-0 items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-white px-6 text-sm text-gray-500">
        Đang khởi tạo phần thi đầu tiên...
      </div>
    );
  }

  const currentGroups = stimulus.questionGroups;
  const handleContinue = () => {
    if (!isValid) {
      setShowValidationDetails(true);
      return;
    }
    onNext();
  };

  return (
    <div className="flex h-[calc(100vh-220px)] min-h-0 flex-col gap-3 overflow-hidden pb-4">
      {stimuli.length > 1 && (
        <div className="flex shrink-0 gap-1 px-2">
          {stimuli.map((item, index) => (
            <button
              key={index}
              type="button"
              onClick={() => {
                setActiveStimulus(index);
                setShowValidationDetails(false);
                setActiveGroupIndex(0);
                setActiveQuestionKey(null);
                setDragGroupIndex(null);
                setLeftWidth(40);
              }}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                index === activeStimulus ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {item.title || `Stimulus ${index + 1}`}
            </button>
          ))}
        </div>
      )}

      <div ref={layoutRef} className="flex min-h-0 flex-1 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <section
          className="flex min-h-0 shrink-0 flex-col overflow-hidden border-r border-gray-200 bg-slate-50/70"
          style={{ flexBasis: `${leftWidth}%` }}
        >
          <div className="shrink-0 border-b border-gray-200 bg-white/90 px-4 py-3 backdrop-blur">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h4 className="text-sm font-semibold text-gray-800">{sectionLabel}</h4>
                <p className="text-xs text-gray-500">
                  {skill === 'LISTENING' ? getListeningTranscriptStatus(skill, stimulus) : 'Nhập passage'}
                </p>
              </div>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 [scrollbar-gutter:stable]">
            <div className="flex min-h-full flex-col rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              {skill === 'LISTENING' && !stimulus.mediaUrl ? (
                <div className="flex min-h-[420px] flex-1 items-stretch">
                  <MediaUploadZone onUploaded={handleListeningUpload} />
                </div>
              ) : (
                <>
                  {skill === 'LISTENING' && stimulus.mediaUrl && (
                    <div className="mb-4 flex items-center gap-3 rounded-lg border border-purple-200 bg-purple-50 p-3">
                      <Music className="h-5 w-5 shrink-0 text-purple-600" />
                      <audio controls src={stimulus.mediaUrl} className="h-8 flex-1" />
                      <button
                        type="button"
                        onClick={() => updateStimulus((s) => ({ ...s, mediaUrl: undefined, content: '' }))}
                        className="text-gray-400 hover:text-red-500"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  )}

                  {skill === 'LISTENING' && transcribing && (
                    <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-4 text-center">
                      <Loader2 className="mx-auto mb-2 h-6 w-6 animate-spin text-blue-500" />
                      <p className="text-sm font-medium text-blue-700">Đang tạo transcript tự động...</p>
                    </div>
                  )}

                  <div className="flex min-h-0 flex-1 flex-col">
                    <StimulusCard stimulus={stimulus} onChange={(updated) => updateStimulus(() => updated)} />
                  </div>
                </>
              )}
            </div>
          </div>
        </section>

        <button
          type="button"
          aria-label="Resize columns"
          onPointerDown={(event) => {
            event.preventDefault();
            setIsResizing(true);
          }}
          className="group relative z-20 flex w-3 shrink-0 cursor-col-resize items-center justify-center bg-gray-100 transition-colors hover:bg-blue-100"
        >
          <span className="h-12 w-px bg-gray-300 transition-colors group-hover:bg-blue-400" />
          <GripVertical className="absolute h-4 w-4 text-gray-400 transition-colors group-hover:text-blue-600" />
        </button>

        <section className="flex min-h-0 flex-1 flex-col overflow-hidden bg-white">
          <div className="shrink-0 border-b border-gray-200 bg-white/95 px-4 py-3 backdrop-blur">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-gray-800">Luồng câu hỏi</h3>
                <p className="text-xs text-gray-500">
                  {stimulus.questionGroups.reduce((sum, group) => sum + group.questions.length, 0)} câu hỏi trong{' '}
                  {stimulus.questionGroups.length} nhóm
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button type="button" size="sm" variant="outline" className="h-8 gap-1 border-dashed text-xs" onClick={addGroup}>
                  <Plus className="h-3.5 w-3.5" />
                  Thêm nhóm câu hỏi
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-8 gap-1 text-xs"
                  onClick={addQuestionToFocusedGroup}
                  disabled={!currentGroups[activeGroupIndex]}
                >
                  <Plus className="h-3.5 w-3.5" />
                  Thêm câu hỏi cho nhóm đang focus
                </Button>
              </div>
            </div>
          </div>

          <div className="shrink-0 border-b border-gray-200 bg-slate-50 px-4 py-3">
            <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-gutter:stable]">
              {currentGroups.map((group, index) => {
                const isActive = activeGroupIndex === index;
                const invalid = isGroupIncomplete(group);
                const label = getGroupTypeLabel(group);

                return (
                  <button
                    key={`${index}-${group.questionTypeCode}-${group.questions.length}`}
                    type="button"
                    onClick={() => handleGroupTabClick(index)}
                    className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                      isActive
                        ? 'border-blue-600 bg-blue-600 text-white'
                        : showValidationDetails && invalid
                          ? 'border-red-200 bg-white text-gray-600 hover:border-red-300 hover:text-red-700'
                          : 'border-gray-200 bg-white text-gray-600 hover:border-blue-300 hover:text-blue-700'
                    }`}
                  >
                    <span>{`Nhóm ${index + 1}`}</span>
                    <span className={`rounded-full px-1.5 py-0.5 text-[10px] ${isActive ? 'bg-white/20' : 'bg-gray-100 text-gray-500'}`}>
                      {label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div ref={questionScrollRef} className="min-h-0 flex-1 overflow-y-scroll px-4 py-4 [scrollbar-gutter:stable]">
            <div className="space-y-4">
              {currentGroups.map((group, groupIndex) => {
                const groupPositionOffset = getPositionOffset(groupIndex);
                const isActive = activeGroupIndex === groupIndex;

                return (
                  <Fragment key={`${groupIndex}-${group.questionTypeCode}-${group.questions.length}`}>
                    {dragGroupIndex !== null && groupDropIndex === groupIndex && dragGroupIndex !== groupIndex && (
                      <div className="rounded-2xl border-2 border-dashed border-blue-300 bg-blue-50/60 px-4 py-10 text-center text-sm font-medium text-blue-500">
                        Thả nhóm vào đây
                      </div>
                    )}
                    <div
                      ref={(el) => {
                        groupRefs.current[groupIndex] = el;
                      }}
                      data-group-index={groupIndex}
                      onDragOver={(event) => {
                        if (dragGroupIndex === null) return;
                        event.preventDefault();
                        setGroupDropIndex(groupIndex);
                      }}
                      onDrop={(event) => {
                        event.preventDefault();
                        if (dragGroupIndex === null) return;
                        const from = dragGroupIndex;
                        const to = groupDropIndex ?? groupIndex;
                        if (from !== to) reorderGroups(from, to);
                        finishGroupDrag();
                      }}
                      onDragEnd={finishGroupDrag}
                      className={`group rounded-2xl border bg-white shadow-sm transition-shadow ${
                        isActive ? 'border-blue-300 shadow-blue-100' : 'border-gray-200'
                      } ${dragGroupIndex === groupIndex ? 'ring-2 ring-blue-400' : ''}`}
                    >
                      <QuestionGroupEditor
                        group={group}
                        groupIndex={groupIndex}
                        positionOffset={groupPositionOffset}
                        stimulusContent={stimulus.content}
                        onChange={(updated) => updateGroup(groupIndex, updated)}
                        onRemove={() => removeGroup(groupIndex)}
                        dragHandleProps={{
                          onDragStart: () => beginGroupDrag(groupIndex),
                          onDragEnd: finishGroupDrag,
                        }}
                      />
                    </div>
                  </Fragment>
                );
              })}

              {dragGroupIndex !== null && groupDropIndex === currentGroups.length && (
                <div className="rounded-2xl border-2 border-dashed border-blue-300 bg-blue-50/60 px-4 py-10 text-center text-sm font-medium text-blue-500">
                  Thả nhóm vào cuối danh sách
                </div>
              )}

              {stimulus.questionGroups.length === 0 ? (
                <div className="rounded-lg border-2 border-dashed border-gray-200 p-8 text-center text-sm text-gray-400">
                  Nhấn &quot;Thêm nhóm câu hỏi&quot; để bắt đầu tạo câu hỏi.
                </div>
              ) : null}
            </div>
          </div>
        </section>
      </div>

      <div className="flex justify-between px-2 pt-1">
        <Button variant="outline" onClick={onBack}>
          Quay lại
        </Button>
        <Button onClick={handleContinue}>
          Xem lại & Nộp
        </Button>
      </div>
    </div>
  );
}

