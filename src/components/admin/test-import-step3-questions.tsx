'use client';

import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { GripVertical, Highlighter, PencilLine, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { QuestionGroupEditor } from '@/components/admin/test-import-question-group-editor';
import { applyHighlights, type EvidenceEntry } from '@/components/admin/test-edit-highlight-evidence';
import { ReadingQuestionsPanel } from '@/components/reading/reading-questions-panel';
import { mapStimulusRequestToDetail } from '@/components/admin/test-import-preview-mapper';
import { formatReadingPassage } from '@/lib/format-reading-passage';
import type { QuestionGroupRequest, StimulusRequest } from '@/types/admin.types';

interface Props {
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

export function TestImportStep3({ stimuli, onChange, onNext, onBack }: Props) {
  const [activeStimulus, setActiveStimulus] = useState(0);
  const [isPreview, setIsPreview] = useState(false);
  const [showValidationDetails, setShowValidationDetails] = useState(false);
  const [pendingEvidence, setPendingEvidence] = useState<string | null>(null);
  const [leftWidth, setLeftWidth] = useState(40);
  const [isResizing, setIsResizing] = useState(false);
  const [activeGroupIndex, setActiveGroupIndex] = useState(0);
  const [dragGroupIndex, setDragGroupIndex] = useState<number | null>(null);
  const [groupDropIndex, setGroupDropIndex] = useState<number | null>(null);
  const [pendingEvidenceOffset, setPendingEvidenceOffset] = useState(-1);
  const [activeQuestionKey, setActiveQuestionKey] = useState<string | null>(null);

  const passageRef = useRef<HTMLDivElement>(null);
  const layoutRef = useRef<HTMLDivElement>(null);
  const questionScrollRef = useRef<HTMLDivElement>(null);
  const groupRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const questionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const stimulus = stimuli[activeStimulus];
  const sectionLabel = stimulus?.title?.trim() || (stimulus?.section ? `Phần ${stimulus.section}` : `Phần ${activeStimulus + 1}`);

  const updateStimulus = useCallback(
    (fn: (s: StimulusRequest) => StimulusRequest) => {
      onChange(stimuli.map((item, index) => (index === activeStimulus ? fn(item) : item)));
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

  const getQuestionRefKey = useCallback((groupIndex: number, questionIndex: number) => `${groupIndex}:${questionIndex}`, []);

  const scrollToQuestionKey = useCallback((questionKey: string) => {
    const container = questionScrollRef.current;
    if (!container) return;

    const target = container.querySelector<HTMLElement>(`[data-question-key="${questionKey}"]`);
    if (!target) return;

    const containerRect = container.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    const nextTop = container.scrollTop + (targetRect.top - containerRect.top) - 12;

    container.scrollTo({ top: nextTop, behavior: 'smooth' });
  }, []);

  const captureSelection = useCallback(() => {
    const selection = window.getSelection();
    const text = selection?.toString().trim();
    if (!text || !passageRef.current || !selection?.anchorNode) return;
    if (!passageRef.current.contains(selection.anchorNode)) return;

    try {
      const range = selection.getRangeAt(0);
      const preRange = document.createRange();
      preRange.selectNodeContents(passageRef.current);
      preRange.setEnd(range.startContainer, range.startOffset);
      setPendingEvidenceOffset(preRange.toString().length);
    } catch {
      setPendingEvidenceOffset(-1);
    }

    setPendingEvidence(text);
    selection.removeAllRanges();
  }, []);

  const allEvidences = useMemo((): EvidenceEntry[] => {
    if (!stimulus) return [];

    const entries: EvidenceEntry[] = [];
    stimulus.questionGroups.forEach((group) => {
      group.questions.forEach((question) => {
        if (!question.explanation?.evidence) return;
        entries.push({
          text: question.explanation.evidence,
          offset: pendingEvidenceOffset >= 0 ? pendingEvidenceOffset : -1,
        });
      });
    });
    return entries;
  }, [pendingEvidenceOffset, stimulus]);

  const passageContent = stimulus?.content || '<p class="text-gray-400 italic">Chưa có nội dung. Quay lại bước 2 để nhập.</p>';
  const formattedPassageContent = useMemo(() => formatReadingPassage(passageContent), [passageContent]);

  useEffect(() => {
    const el = passageRef.current;
    if (!el) return;
    el.innerHTML = formattedPassageContent;
    applyHighlights(el, allEvidences);
  }, [allEvidences, formattedPassageContent]);

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
  }, [stimulus, getQuestionRefKey]);

  useEffect(() => {
    const root = questionScrollRef.current;
    if (!root || !stimulus || isPreview) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const active = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (!active) return;

        const groupIndex = Number((active.target as HTMLElement).dataset.groupIndex);
        const questionIndex = Number((active.target as HTMLElement).dataset.questionIndex);
        if (Number.isNaN(groupIndex) || Number.isNaN(questionIndex)) return;

        setActiveGroupIndex(groupIndex);
        setActiveQuestionKey(getQuestionRefKey(groupIndex, questionIndex));
      },
      {
        root,
        threshold: [0.2, 0.4, 0.6, 0.8],
        rootMargin: '-10% 0px -65% 0px',
      }
    );

    Object.values(questionRefs.current).forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [stimulus, isPreview, getQuestionRefKey]);

  const handleGroupTabClick = (groupIndex: number) => {
    const el = groupRefs.current[groupIndex];
    if (!el) return;
    setActiveGroupIndex(groupIndex);
    const firstQuestionKey = currentGroups[groupIndex]?.questions.length ? getQuestionRefKey(groupIndex, 0) : null;
    setActiveQuestionKey(firstQuestionKey);
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

  if (!stimulus) return null;

  const previewDetail = mapStimulusRequestToDetail(stimulus, activeStimulus);
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
                setPendingEvidence(null);
                setPendingEvidenceOffset(-1);
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
                <p className="text-xs text-gray-500">{stimulus.mediaUrl ? 'Bản chép lời' : 'Bài đọc'}</p>
              </div>
              <Button type="button" size="sm" variant="outline" className="h-8 gap-1 text-xs" onClick={captureSelection}>
                <Highlighter className="h-3 w-3" />
                Quét dẫn chứng
              </Button>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-scroll px-4 py-4 [scrollbar-gutter:stable]">
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h4 className="text-sm font-semibold text-gray-700">Nội dung phần thi</h4>
                <span className="text-xs text-gray-400">{stimulus.questionGroups.length} nhÃ³m</span>
              </div>
              <div
                ref={passageRef}
                className="overflow-y-scroll rounded-lg border border-gray-300 bg-white px-5 py-4 text-sm leading-relaxed select-text prose prose-sm max-w-none prose-p:my-3"
              />
              {pendingEvidence && (
                <div className="mt-3 rounded-md border border-green-300 bg-green-50 px-3 py-2">
                  <p className="mb-1 text-xs font-medium text-green-700">
                    Đã chọn đoạn văn, dùng đoạn này để gán dẫn chứng:
                  </p>
                  <p className="line-clamp-3 text-xs text-green-800">&ldquo;{pendingEvidence}&rdquo;</p>
                  <button
                    type="button"
                    onClick={() => setPendingEvidence(null)}
                    className="mt-1 text-xs text-green-600 hover:text-green-800"
                  >
                    Hủy
                  </button>
                </div>
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
                  variant={isPreview ? 'default' : 'outline'}
                  className="h-8 gap-1 text-xs"
                  onClick={() => setIsPreview((prev) => !prev)}
                >
                  <PencilLine className="h-3.5 w-3.5" />
                  {isPreview ? 'Đang xem trước' : 'Soạn câu hỏi'}
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

          {!isPreview && currentGroups.length > 0 && (
            <div className="shrink-0 border-b border-gray-200 bg-slate-50 px-4 py-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-medium text-gray-500">Câu hỏi</span>
                {currentGroups.map((group, groupIndex) => (
                  <Fragment key={`qmap-${groupIndex}`}>
                    {groupIndex > 0 && <span className="px-1 text-gray-300">🔹</span>}
                    {group.questions.map((question, questionIndex) => {
                      const questionKey = getQuestionRefKey(groupIndex, questionIndex);
                      const globalNumber = getPositionOffset(groupIndex) + questionIndex + 1;
                      const isActiveQuestion =
                        activeQuestionKey === questionKey || (!activeQuestionKey && groupIndex === activeGroupIndex && questionIndex === 0);
                      const invalid =
                        !question.content.trim() || !question.options.some((option) => option.isCorrect && option.content.trim().length > 0);

                      return (
                        <button
                          key={questionKey}
                          type="button"
                          onClick={() => {
                            setActiveGroupIndex(groupIndex);
                            setActiveQuestionKey(questionKey);
                            scrollToQuestionKey(questionKey);
                          }}
                          className={`inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                            isActiveQuestion
                              ? 'border-blue-600 bg-blue-600 text-white'
                              : showValidationDetails && invalid
                                ? 'border-red-200 bg-white text-gray-600 hover:border-red-300 hover:text-red-700'
                                : 'border-gray-200 bg-white text-gray-600 hover:border-blue-300 hover:text-blue-700'
                          }`}
                        >
                          <span>{globalNumber}</span>
                        </button>
                      );
                    })}
                  </Fragment>
                ))}
              </div>
            </div>
          )}

          <div ref={questionScrollRef} className="min-h-0 flex-1 overflow-y-scroll px-4 py-4 [scrollbar-gutter:stable]">
            {isPreview ? (
              <ReadingQuestionsPanel
                stimulus={previewDetail}
                submitted={false}
                answers={{}}
                onAnswer={() => {}}
                textAnswers={{}}
                onTextAnswer={() => {}}
              />
            ) : (
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
                          pendingEvidence={pendingEvidence}
                          onAssignEvidence={() => setPendingEvidence(null)}
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
            )}
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

