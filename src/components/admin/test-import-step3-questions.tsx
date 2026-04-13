'use client';

import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { GripVertical, Highlighter, Loader2, Maximize, Minimize, Minus, Music, Plus, Search, Target, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { MediaUploadZone } from '@/components/admin/media-upload-zone';
import { AudioUploadSection } from '@/components/admin/audio-upload-section';
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
  onAudioDurationChange?: (duration: number) => void;
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

function segmentsToHtml(segments: { text: string; speaker?: string; startTime?: number; endTime?: number }[]): string {
  return segments
    .map((seg) => {
      const speaker = seg.speaker ? `<strong>${seg.speaker}:</strong> ` : '';
      const attrs = [
        'data-transcript-segment="true"',
        Number.isFinite(seg.startTime) ? `data-start-time="${seg.startTime}"` : '',
        Number.isFinite(seg.endTime) ? `data-end-time="${seg.endTime}"` : '',
      ].filter(Boolean).join(' ');
      return `<p ${attrs}>${speaker}${seg.text}</p>`;
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

export function TestImportStep3({ skill, stimuli, onChange, onNext, onBack, onAudioDurationChange }: Props) {
  const [activeStimulus, setActiveStimulus] = useState(0);
  const [showValidationDetails, setShowValidationDetails] = useState(false);
  const [leftWidth, setLeftWidth] = useState(40);
  const [isResizing, setIsResizing] = useState(false);
  const [activeGroupIndex, setActiveGroupIndex] = useState(0);
  const [activeQuestionKey, setActiveQuestionKey] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [dragGroupIndex, setDragGroupIndex] = useState<number | null>(null);
  const [groupDropIndex, setGroupDropIndex] = useState<number | null>(null);
  const [transcribing, setTranscribing] = useState(false);
  const [pendingEvidence, setPendingEvidence] = useState<string | null>(null);
  const [pendingEvidenceTarget, setPendingEvidenceTarget] = useState<{ groupIndex: number; questionIndex: number } | null>(null);

  const layoutRef = useRef<HTMLDivElement>(null);
  const questionScrollRef = useRef<HTMLDivElement>(null);
  const groupRefs = useRef<Record<number, HTMLDivElement | null>>({});

  // Extract audio duration when listening audio is uploaded
  useEffect(() => {
    if (skill !== 'LISTENING' || !onAudioDurationChange) return;
    
    const stimulus = stimuli[0];
    if (!stimulus?.mediaUrl) {
      onAudioDurationChange(0);
      return;
    }

    const audio = new Audio(stimulus.mediaUrl);
    audio.addEventListener('loadedmetadata', () => {
      onAudioDurationChange(audio.duration);
    });
    audio.addEventListener('error', () => {
      onAudioDurationChange(0);
    });
  }, [skill, stimuli, onAudioDurationChange]);

  const stimulus = stimuli[activeStimulus];
  const sectionLabel = 'Đề thi';

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

  const handleQuestionClick = useCallback((groupIndex: number, questionIndex: number) => {
    const nextKey = `${groupIndex}:${questionIndex}`;
    setActiveQuestionKey(nextKey);
    const container = questionScrollRef.current;
    const target = container?.querySelector<HTMLElement>(`[data-question-key="${nextKey}"]`);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
    } else {
      // If target not found in current view (maybe group is collapsed or not rendered?),
      // scroll to the group first.
      const groupEl = groupRefs.current[groupIndex];
      if (groupEl) {
        groupEl.scrollIntoView({ behavior: 'auto', block: 'start' });
        // Then try again after a small delay
        setTimeout(() => {
          const retryTarget = container?.querySelector<HTMLElement>(`[data-question-key="${nextKey}"]`);
          retryTarget?.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
        }, 50);
      }
    }
  }, []);

  const questionMiniMap = useMemo(() => {
    if (!stimulus) return [];
    return stimulus.questionGroups.flatMap((group, groupIndex) => {
      let offset = 0;
      for (let i = 0; i < groupIndex; i++) {
        offset += stimulus.questionGroups[i].questions.length;
      }
      return group.questions.map((_, questionIndex) => ({
        number: offset + questionIndex + 1,
        groupIndex,
        questionIndex,
      }));
    });
  }, [stimulus]);

  const captureSelection = useCallback(() => {
    const selection = window.getSelection();
    const text = selection?.toString().trim();
    if (!text) {
      toast.error('Vui lòng bôi đen văn bản trước khi quét');
      return;
    }
    setPendingEvidence(text);
    toast.success('Đã quét dẫn chứng - hãy chọn câu để gán');
    // Clear selection for better UX
    selection?.removeAllRanges();
  }, []);

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

  const beginAssignEvidence = (groupIndex: number, questionIndex: number) => {
    setPendingEvidenceTarget({ groupIndex, questionIndex });
    setPendingEvidence('');
  };

  const commitAssignEvidence = () => {
    if (pendingEvidenceTarget === null || pendingEvidence === null) return;
    const { groupIndex, questionIndex } = pendingEvidenceTarget;
    updateStimulus((s) => {
      const questionGroups = [...s.questionGroups];
      const group = questionGroups[groupIndex];
      const questions = [...group.questions];
      const question = { ...questions[questionIndex] };
      question.explanation = { ...question.explanation, evidence: pendingEvidence ?? '' };
      questions[questionIndex] = question;
      group.questions = questions;
      questionGroups[groupIndex] = group;
      return { ...s, questionGroups };
    });
    setPendingEvidence(null);
    setPendingEvidenceTarget(null);
  };

  const cancelAssignEvidence = () => {
    setPendingEvidence(null);
    setPendingEvidenceTarget(null);
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

  // Track active question on scroll
  useEffect(() => {
    const root = questionScrollRef.current;
    if (!root || !stimulus) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const active = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (!active) return;

        const key = (active.target as HTMLElement).dataset.questionKey;
        if (key) {
          setActiveQuestionKey(key);
          const [gIndex] = key.split(':').map(Number);
          if (!Number.isNaN(gIndex)) setActiveGroupIndex(gIndex);
        }
      },
      {
        root,
        threshold: [0.1, 0.3, 0.5, 0.8],
        rootMargin: '-20% 0px -60% 0px',
      }
    );

    const targets = root.querySelectorAll<HTMLElement>('[data-question-key]');
    targets.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [stimulus]);

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
      <div className="flex h-[calc(100vh-160px)] min-h-0 items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-white px-6 text-sm text-gray-500">
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
    <div className="flex h-[calc(100vh-160px)] min-h-0 flex-col gap-3 overflow-hidden pb-4">
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

      <div
        ref={layoutRef}
        className="flex min-h-0 flex-1 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"
        style={{ zoom: zoomLevel }}
      >
        <section
          className="flex min-h-0 shrink-0 flex-col overflow-hidden border-r border-gray-200 bg-slate-50/70"
          style={{ flexBasis: `${leftWidth}%` }}
        >
          <div className="shrink-0 border-b border-gray-200 bg-white/95 px-4 py-3 backdrop-blur">
            <div className="flex h-8 items-center justify-between gap-3">
              <h3 className="text-sm font-semibold text-gray-800">Đề thi</h3>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-7 gap-1.5 px-2 text-[11px] font-medium text-gray-600 hover:text-blue-600 active:bg-blue-50"
                onPointerDown={(e) => {
                  e.preventDefault(); // Prevents focus loss from the editor
                  captureSelection();
                }}
              >
                <Target className="h-3.5 w-3.5" />
                Quét dẫn chứng
              </Button>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 [scrollbar-gutter:stable]">
            <div className="flex min-h-full flex-col rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              {skill === 'LISTENING' && !stimulus.mediaUrl ? (
                <div className="flex flex-1 items-stretch">
                  <AudioUploadSection onUploaded={handleListeningUpload} />
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

                  {pendingEvidence && (
                    <div className="mt-3 rounded-lg border border-green-200 bg-green-50 px-3 py-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-semibold text-green-700 uppercase tracking-tight">Dẫn chứng đã quẹt:</span>
                        <button
                          type="button"
                          onClick={() => setPendingEvidence(null)}
                          className="text-green-500 hover:text-green-700"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <p className="mt-0.5 line-clamp-2 text-xs italic text-green-800">&ldquo;{pendingEvidence}&rdquo;</p>
                      <p className="mt-1 text-[10px] text-green-600/80 italic">Giờ hãy chọn 1 câu bất kỳ để gán dẫn chứng này</p>
                    </div>
                  )}
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
                <h3 className="text-sm font-semibold text-gray-800">Câu hỏi</h3>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="mr-2 flex items-center rounded-md border border-gray-200 bg-gray-50/50 p-0.5">
                  <button
                    type="button"
                    onClick={() => setZoomLevel((prev) => Math.max(0.6, prev - 0.1))}
                    className="flex h-7 w-7 items-center justify-center rounded-sm text-gray-500 transition-all hover:bg-white hover:text-blue-600"
                    title="Zoom Out"
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <div className="flex min-w-[36px] items-center justify-center px-1 text-[10px] font-bold text-gray-600">
                    {Math.round(zoomLevel * 100)}%
                  </div>
                  <button
                    type="button"
                    onClick={() => setZoomLevel((prev) => Math.min(1.2, prev + 0.1))}
                    className="flex h-7 w-7 items-center justify-center rounded-sm text-gray-500 transition-all hover:bg-white hover:text-blue-600"
                    title="Zoom In"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>

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
                  Thêm câu hỏi
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

            {questionMiniMap.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5 border-t border-gray-100 pt-3">
                {questionMiniMap.map((item) => {
                  const key = `${item.groupIndex}:${item.questionIndex}`;
                  const isActive = activeQuestionKey === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => handleQuestionClick(item.groupIndex, item.questionIndex)}
                      className={`flex h-7 w-7 items-center justify-center rounded-md border text-[11px] font-medium transition-colors ${
                        isActive
                          ? 'border-blue-600 bg-blue-600 text-white shadow-sm'
                          : 'border-gray-200 bg-white text-gray-500 hover:border-blue-400 hover:text-blue-600'
                      }`}
                    >
                      {item.number}
                    </button>
                  );
                })}
              </div>
            )}
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
                        pendingEvidence={pendingEvidence}
                        onAssignEvidence={(questionIndex) => beginAssignEvidence(groupIndex, questionIndex)}
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

