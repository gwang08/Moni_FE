'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import UnderlineExt from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import LinkExtension from '@tiptap/extension-link';
import ImageExtension from '@tiptap/extension-image';
import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
import HighlightExt from '@tiptap/extension-highlight';
import { Table as TableExtension } from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import { AlertTriangle, GripVertical, Highlighter, Loader2, Pencil, Plus, Save, Trash2 } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { RichTextToolbar } from '@/components/admin/rich-text-toolbar';
import { TestEditQuestionCard } from '@/components/admin/test-edit-question-card';
import { TestEditAddQuestionForm } from '@/components/admin/test-edit-add-question-form';
import { TestEditMatchingHeadings } from '@/components/admin/test-edit-matching-headings';
import { TestEditMatchingInformation } from '@/components/admin/test-edit-matching-information';
import { TestEditMatchingFeature } from '@/components/admin/test-edit-matching-feature';
import { TestEditGapFilling } from '@/components/admin/test-edit-gap-filling';
import { TestEditAddQuestionGroupForm } from '@/components/admin/test-edit-add-question-group-form';
import { useTestEditMutations } from '@/components/admin/use-test-edit-mutations';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { applyHighlights, type EvidenceEntry } from '@/components/admin/test-edit-highlight-evidence';
import { TestEditWritingContent } from '@/components/admin/test-edit-writing-content';
import { TestEditSpeakingContent } from '@/components/admin/test-edit-speaking-content';
import { MediaUploadZone } from '@/components/admin/media-upload-zone';
import {
  batchUpdateQuestions,
  updateQuestionGroupContent,
  updateQuestionGroupImageUrl,
  updateQuestionGroupOrderIndex,
  updateQuestionGroupInstruction,
  updateQuestionGroupTypeCode,
  updateStimulus,
} from '@/lib/admin-api';
import type { TestDetailResponse, QuestionGroupDetail } from '@/types/test.types';
import type { QuestionTypeCode, QuestionUpdateRequest } from '@/types/admin.types';

function inferQuestionType(group: QuestionGroupDetail): QuestionTypeCode {
  const q = group.questions[0];
  if (!q || !q.options.length) return 'GAP_FILLING';
  const opts = q.options;
  if (opts.length === 3) {
    const labels = opts.map((o) => (o.label || o.content).toLowerCase());
    if (labels.some((l) => l === 'true' || l === 'false')) return 'TFNG';
    if (labels.some((l) => l === 'yes' || l === 'no')) return 'YNNG';
  }
  if (opts.length >= 2 && opts.length <= 5 && opts.some((o) => ['A', 'B', 'C', 'D', 'E'].includes(o.label))) return 'MCQ';
  if (opts.length === 1 && opts[0].isCorrect) return 'GAP_FILLING';
  return 'MCQ';
}

const TYPE_LABELS: Record<string, string> = {
  MCQ: 'Multiple Choice (One Answer)',
  MCQ_MULTIPLE: 'Multiple Choice (Many Answers)',
  TFNG: 'True / False / Not Given',
  YNNG: 'Yes / No / Not Given',
  MATCHING_HEADINGS: 'Matching Headings',
  MATCHING_INFORMATION: 'Matching Information',
  MATCHING_FEATURE: 'Matching Features',
  DIAGRAM_LABEL: 'Map / Diagram Label',
  GAP_FILLING: 'Gap Filling',
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

function isQuestionIncomplete(question: { content: string; options: { content: string; isCorrect: boolean }[] }) {
  if (!question.content.trim()) return true;
  if (!question.options.length) return true;
  const hasAnyFilledOption = question.options.some((option) => option.content.trim().length > 0);
  const hasCorrectOption = question.options.some((option) => option.isCorrect && option.content.trim().length > 0);
  return !hasAnyFilledOption || !hasCorrectOption;
}

function getQuestionRangeLabel(group: { questions: { position: number }[] }, index: number) {
  const first = group.questions[0]?.position ?? index + 1;
  const last = group.questions[group.questions.length - 1]?.position ?? first;
  return `Questions ${first}-${last}`;
}

function moveItem<T>(items: T[], from: number, to: number): T[] {
  if (from === to) return items;
  const next = [...items];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

const EDITOR_EXTENSIONS = [
  StarterKit,
  Placeholder.configure({ placeholder: 'Nhap noi dung de bai...' }),
  UnderlineExt,
  Subscript,
  Superscript,
  HighlightExt.configure({ multicolor: true }),
  TextAlign.configure({ types: ['heading', 'paragraph'] }),
  LinkExtension.configure({ openOnClick: false }),
  ImageExtension,
  TableExtension.configure({ resizable: true }),
  TableRow,
  TableCell,
  TableHeader,
];

function PassageEditor({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const editor = useEditor({
    extensions: EDITOR_EXTENSIONS,
    content: value,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none min-h-[220px] focus:outline-none p-4',
      },
    },
    onUpdate: ({ editor: ed }) => onChange(ed.getHTML()),
  });

  useEffect(() => () => { editor?.destroy(); }, [editor]);

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-blue-300 bg-white">
      <RichTextToolbar editor={editor} />
      <EditorContent editor={editor} className="min-h-0 flex-1 overflow-y-auto" />
    </div>
  );
}

function DiagramImageSection({ groupId, imageUrl, testId }: { groupId: number; imageUrl?: string; testId: string }) {
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);

  const handleUpload = async (url: string) => {
    setSaving(true);
    try {
      await updateQuestionGroupImageUrl(groupId, url);
      toast.success('Da cap nhat hinh anh');
      queryClient.invalidateQueries({ queryKey: ['admin', 'test', testId] });
    } catch {
      toast.error('Cap nhat hinh anh that bai');
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async () => {
    setSaving(true);
    try {
      await updateQuestionGroupImageUrl(groupId, '');
      toast.success('Da xoa hinh anh');
      queryClient.invalidateQueries({ queryKey: ['admin', 'test', testId] });
    } catch {
      toast.error('Xoa hinh anh that bai');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mb-3">
      <span className="mb-1 block text-xs font-medium text-gray-500">Diagram / map image</span>
      {imageUrl ? (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
          <div className="relative h-40 w-full bg-gray-50">
            <Image src={imageUrl} alt="Diagram" fill unoptimized className="object-contain" />
          </div>
          <div className="flex items-center justify-between border-t bg-gray-50 px-3 py-1.5">
            <span className="max-w-[70%] truncate text-xs text-gray-400">{imageUrl}</span>
            <button type="button" onClick={handleRemove} disabled={saving} className="text-xs text-red-500 hover:text-red-700 disabled:opacity-50">
              {saving ? 'Dang xu ly...' : 'Xoa anh'}
            </button>
          </div>
        </div>
      ) : (
        <MediaUploadZone onUploaded={handleUpload} />
      )}
    </div>
  );
}

function GroupEditForm({
  groupId,
  typeCode,
  instruction,
  groupContent,
  onChange,
  onCancel,
  onSave,
}: {
  groupId: number;
  typeCode: string;
  instruction: string;
  groupContent: string;
  onChange: (draft: { typeCode: string; instruction: string; groupContent: string }) => void;
  onCancel: () => void;
  onSave: () => void;
}) {
  return (
    <div className="rounded-xl border border-blue-200 bg-blue-50/40 p-3">
      <div className="grid gap-3 md:grid-cols-3">
        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-600">Question type</label>
          <select
            value={typeCode}
            onChange={(event) => onChange({ typeCode: event.target.value, instruction, groupContent })}
            className="h-9 w-full rounded-md border border-gray-300 bg-white px-3 text-sm"
          >
            {Object.entries(TYPE_LABELS).map(([code, labelText]) => (
              <option key={code} value={code}>
                {labelText}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1 md:col-span-2">
          <label className="text-xs font-medium text-gray-600">Hướng dẫn</label>
          <input
            value={instruction}
            onChange={(event) => onChange({ typeCode, instruction: event.target.value, groupContent })}
            className="h-9 w-full rounded-md border border-gray-300 bg-white px-3 text-sm"
            placeholder="VD: Chọn đáp án đúng..."
          />
        </div>
        <div className="space-y-1 md:col-span-3">
          <label className="text-xs font-medium text-gray-600">Nội dung nhóm</label>
          <textarea
            value={groupContent}
            onChange={(event) => onChange({ typeCode, instruction, groupContent: event.target.value })}
            rows={3}
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm resize-y"
          />
        </div>
      </div>
      <div className="mt-3 flex justify-end gap-2">
        <Button type="button" size="sm" variant="outline" className="h-8 text-xs" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="button" size="sm" className="h-8 text-xs" onClick={onSave}>
          Save Group
        </Button>
      </div>
      <span className="sr-only">Editing group {groupId}</span>
    </div>
  );
}

interface Props {
  test: TestDetailResponse;
  onBeforeSaveBasicInfo?: () => Promise<boolean> | boolean;
}

export function TestEditContentTab({ test, onBeforeSaveBasicInfo }: Props) {
  const testId = String(test.id);
  const { handleDeleteQuestion, pendingDelete, confirmDelete, cancelDelete } = useTestEditMutations(testId);
  const queryClient = useQueryClient();

  const [activeStimulus, setActiveStimulus] = useState(0);
  const [leftPaneWidth, setLeftPaneWidth] = useState(40);
  const [isResizing, setIsResizing] = useState(false);
  const [pendingEvidence, setPendingEvidence] = useState<string | null>(null);
  const [addingGroup, setAddingGroup] = useState(false);
  const [addingQuestionForGroup, setAddingQuestionForGroup] = useState<number | null>(null);
  const [activeGroupId, setActiveGroupId] = useState<number | null>(null);
  const [editingGroupId, setEditingGroupId] = useState<number | null>(null);
  const [savingPassage, setSavingPassage] = useState(false);

  const [evidenceMap, setEvidenceMap] = useState<Record<number, string>>(() => {
    const map: Record<number, string> = {};
    for (const stimulus of test.stimuli) {
      for (const group of stimulus.questionGroups) {
        for (const question of group.questions) {
          if (question.explanation?.evidence) map[question.id] = question.explanation.evidence;
        }
      }
    }
    return map;
  });
  const [offsetMap, setOffsetMap] = useState<Record<number, number>>({});
  const [groupDrafts, setGroupDrafts] = useState<Record<number, { typeCode: string; instruction: string; groupContent: string }>>(() => {
    const draft: Record<number, { typeCode: string; instruction: string; groupContent: string }> = {};
    for (const stimulus of test.stimuli) {
      for (const group of stimulus.questionGroups) {
        draft[group.id] = {
          typeCode: (group.questionTypeCode as QuestionTypeCode) || inferQuestionType(group),
          instruction: group.instruction || '',
          groupContent: group.groupContent || '',
        };
      }
    }
    return draft;
  });
  const [groupOrder, setGroupOrder] = useState<number[]>([]);
  const [questionOrders, setQuestionOrders] = useState<Record<number, number[]>>({});
  const [dragState, setDragState] = useState<null | {
    kind: 'group' | 'question';
    groupId: number;
    itemId: number;
  }>(null);
  const [dropHint, setDropHint] = useState<null | {
    kind: 'group' | 'question';
    groupId: number;
    itemId: number;
  }>(null);

  const [editingPassage, setEditingPassage] = useState(false);
  const [passageEdit, setPassageEdit] = useState('');
  const [audioUrlEdit, setAudioUrlEdit] = useState('');
  const [activeQuestionId, setActiveQuestionId] = useState<number | null>(null);

  const pendingOffsetRef = useRef(-1);
  const layoutRef = useRef<HTMLDivElement>(null);
  const rightScrollRef = useRef<HTMLDivElement>(null);
  const passageRef = useRef<HTMLDivElement>(null);
  const groupRefs = useRef<Record<number, HTMLElement | null>>({});

  const stimulus = test.stimuli[activeStimulus];

  useEffect(() => {
    const firstGroupId = stimulus?.questionGroups[0]?.id ?? null;
    setActiveGroupId(firstGroupId);
    setAddingGroup(false);
    setAddingQuestionForGroup(null);
    setEditingGroupId(null);
    setPendingEvidence(null);
    setEditingPassage(false);
    setPassageEdit(stimulus?.content || '');
    setAudioUrlEdit(stimulus?.mediaUrl || '');
    setLeftPaneWidth(40);

    const draft: Record<number, { typeCode: string; instruction: string; groupContent: string }> = {};
    for (const stimulusItem of test.stimuli) {
      for (const group of stimulusItem.questionGroups) {
        draft[group.id] = {
          typeCode: (group.questionTypeCode as QuestionTypeCode) || inferQuestionType(group),
          instruction: group.instruction || '',
          groupContent: group.groupContent || '',
        };
      }
    }
    setGroupDrafts(draft);
    const orderedGroups = [...(stimulus?.questionGroups ?? [])].sort(
      (a, b) => (a.orderIndex ?? Number.MAX_SAFE_INTEGER) - (b.orderIndex ?? Number.MAX_SAFE_INTEGER) || a.id - b.id
    );
    setGroupOrder(orderedGroups.map((group) => group.id));
    setQuestionOrders(Object.fromEntries(
      orderedGroups.map((group) => [group.id, [...group.questions].sort((a, b) => a.position - b.position).map((question) => question.id)])
    ));
    setDragState(null);
    setDropHint(null);
  }, [stimulus, test.stimuli]);

  const handleSavePassage = async () => {
    if (!stimulus) return;
    setSavingPassage(true);
    try {
      await updateStimulus(stimulus.id, {
        content: passageEdit,
        mediaUrl: audioUrlEdit || undefined,
      });
      toast.success('Da luu noi dung de bai');
      queryClient.invalidateQueries({ queryKey: ['admin', 'test', testId] });
      setEditingPassage(false);

      const plainText = passageEdit.replace(/<[^>]*>/g, '');
      const affectedPositions: number[] = [];
      let questionIndex = 0;
      for (const group of stimulus.questionGroups) {
        for (const question of group.questions) {
          questionIndex++;
          const evidence = question.explanation?.evidence;
          if (!evidence) continue;
          const chunks = evidence.split('\n---\n');
          const hasInvalidChunk = chunks.some((chunk) => chunk.trim() && !plainText.includes(chunk.trim()));
          if (hasInvalidChunk) affectedPositions.push(questionIndex);
        }
      }
      if (affectedPositions.length > 0) {
        toast.warning(
          `Canh bao: ${affectedPositions.length} cau co dan chung khong con khop voi noi dung moi (cau ${affectedPositions.join(', ')})`
        );
      }
    } catch {
      toast.error('Luu noi dung that bai');
    } finally {
      setSavingPassage(false);
    }
  };

  const persistGroupOrder = async (nextOrder: number[]) => {
    setGroupOrder(nextOrder);
    try {
      await Promise.all(nextOrder.map((groupId, index) => updateQuestionGroupOrderIndex(groupId, index)));
      queryClient.invalidateQueries({ queryKey: ['admin', 'test', testId] });
    } catch {
      toast.error('Khong the cap nhat thu tu nhom');
    }
  };

  const persistQuestionOrder = async (groupId: number, nextOrder: number[]) => {
    setQuestionOrders((prev) => ({ ...prev, [groupId]: nextOrder }));
    try {
      const updates: Record<string, QuestionUpdateRequest> = Object.fromEntries(
        nextOrder.map((questionId, index) => [String(questionId), { orderIndex: index + 1 }])
      );
      await batchUpdateQuestions(
        updates
      );
      queryClient.invalidateQueries({ queryKey: ['admin', 'test', testId] });
    } catch {
      toast.error('Khong the cap nhat thu tu cau hoi');
    }
  };

  const handleSaveGroup = async (groupId: number) => {
    const draft = groupDrafts[groupId];
    if (!draft) return;
    try {
      await Promise.all([
        updateQuestionGroupInstruction(groupId, draft.instruction),
        updateQuestionGroupTypeCode(groupId, draft.typeCode),
        updateQuestionGroupContent(groupId, draft.groupContent),
      ]);
      toast.success('Da luu nhom cau hoi');
      queryClient.invalidateQueries({ queryKey: ['admin', 'test', testId] });
      setEditingGroupId(null);
    } catch {
      toast.error('Khong the luu nhom cau hoi');
    }
  };

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
      pendingOffsetRef.current = preRange.toString().length;
    } catch {
      pendingOffsetRef.current = -1;
    }
    setPendingEvidence(text);
    selection.removeAllRanges();
  }, []);

  const handleEvidenceChange = useCallback((questionId: number, evidence: string) => {
    if (evidence) {
      setEvidenceMap((prev) => ({ ...prev, [questionId]: evidence }));
      setOffsetMap((prev) => ({ ...prev, [questionId]: pendingOffsetRef.current }));
    } else {
      setEvidenceMap((prev) => {
        const next = { ...prev };
        delete next[questionId];
        return next;
      });
      setOffsetMap((prev) => {
        const next = { ...prev };
        delete next[questionId];
        return next;
      });
    }
  }, []);

  const allEvidences = useMemo((): EvidenceEntry[] => {
    if (!stimulus) return [];
    const qIds = stimulus.questionGroups.flatMap((group) => group.questions.map((question) => question.id));
    return qIds.filter((id) => evidenceMap[id]).map((id) => ({ text: evidenceMap[id], offset: offsetMap[id] ?? -1 }));
  }, [stimulus, evidenceMap, offsetMap]);

  const passageContent = stimulus?.content || '';
  useEffect(() => {
    if (editingPassage) return;
    const el = passageRef.current;
    if (!el) return;
    el.innerHTML = passageContent;
    applyHighlights(el, allEvidences);
  }, [passageContent, allEvidences, editingPassage]);

  const orderedGroups = useMemo(() => {
    if (!stimulus) return [];
    const byId = new Map(stimulus.questionGroups.map((group) => [group.id, group]));
    const baseOrder = stimulus.questionGroups
      .slice()
      .sort((a, b) => (a.orderIndex ?? Number.MAX_SAFE_INTEGER) - (b.orderIndex ?? Number.MAX_SAFE_INTEGER) || a.id - b.id)
      .map((group) => group.id);
    const candidateOrder = groupOrder.length === stimulus.questionGroups.length ? groupOrder : baseOrder;
    return candidateOrder.map((id) => byId.get(id)).filter((group): group is QuestionGroupDetail => !!group);
  }, [stimulus, groupOrder]);

  const groupMeta = useMemo(() => {
    return orderedGroups.map((group, index) => {
      const typeCode = (group.questionTypeCode as QuestionTypeCode) || inferQuestionType(group);
      const invalid = group.questions.some((question) => isQuestionIncomplete(question));
      return {
        group,
        typeCode,
        invalid,
        questionCount: group.questions.length,
        label: getQuestionRangeLabel(group, index),
      };
    });
  }, [orderedGroups]);

  const questionMiniMap = useMemo(
    () =>
      groupMeta.flatMap((meta, groupIndex) => {
        const questionPositionOffset = groupMeta
          .slice(0, groupIndex)
          .reduce((sum, item) => sum + item.questionCount, 0);
        const questionOrder = questionOrders[meta.group.id] ?? meta.group.questions
          .slice()
          .sort((a, b) => a.position - b.position)
          .map((question) => question.id);
        return questionOrder.map((questionId, questionIndex) => ({
          questionId,
          groupId: meta.group.id,
          number: questionPositionOffset + questionIndex + 1,
        }));
      }),
    [groupMeta, questionOrders]
  );

  const questionDisplayPositions = useMemo(() => {
    return new Map(questionMiniMap.map(({ questionId, number }) => [questionId, number]));
  }, [questionMiniMap]);

  const questionToGroupId = useMemo(() => {
    const map = new Map<number, number>();
    for (const meta of groupMeta) {
      for (const question of meta.group.questions) {
        map.set(question.id, meta.group.id);
      }
    }
    return map;
  }, [groupMeta]);

  useEffect(() => {
    const root = rightScrollRef.current;
    if (!root || !stimulus) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const active = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (!active) return;
        const groupId = Number((active.target as HTMLElement).dataset.groupId);
        if (!Number.isNaN(groupId)) setActiveGroupId(groupId);
      },
      {
        root,
        threshold: [0.15, 0.3, 0.5, 0.7],
        rootMargin: '-12% 0px -70% 0px',
      }
    );

    for (const { group } of groupMeta) {
      const el = groupRefs.current[group.id];
      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
  }, [groupMeta, stimulus]);

  useEffect(() => {
    const root = rightScrollRef.current;
    if (!root || !stimulus) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const active = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (!active) return;

        const questionId = Number((active.target as HTMLElement).dataset.questionId);
        if (!Number.isNaN(questionId)) {
          setActiveQuestionId(questionId);
          const groupId = questionToGroupId.get(questionId);
          if (groupId != null) setActiveGroupId(groupId);
        }
      },
      {
        root,
        threshold: [0.2, 0.35, 0.5, 0.7],
        rootMargin: '-10% 0px -60% 0px',
      }
    );

    const targets = root.querySelectorAll<HTMLElement>('[data-question-id]');
    targets.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [questionToGroupId, stimulus]);

  useEffect(() => {
    if (!isResizing) return;

    const handleMove = (event: PointerEvent) => {
      const container = layoutRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const nextWidth = ((event.clientX - rect.left) / rect.width) * 100;
      setLeftPaneWidth(clamp(nextWidth, 28, 60));
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

  const scrollToGroup = (groupId: number) => {
    const el = groupRefs.current[groupId];
    if (!el) return;
    setActiveGroupId(groupId);
    el.scrollIntoView({ behavior: 'auto', block: 'start' });
  };

  const scrollToQuestion = (questionId: number) => {
    const el = document.getElementById(`question-${questionId}`);
    const root = rightScrollRef.current;
    if (!el || !root) return;
    setActiveQuestionId(questionId);
    const groupId = questionToGroupId.get(questionId);
    if (groupId != null) setActiveGroupId(groupId);

    const rootRect = root.getBoundingClientRect();
    const targetRect = el.getBoundingClientRect();
    const nextTop = root.scrollTop + (targetRect.top - rootRect.top) - root.clientHeight / 2 + targetRect.height / 2;
    const maxTop = root.scrollHeight - root.clientHeight;
    root.scrollTo({
      top: clamp(nextTop, 0, maxTop),
      behavior: 'auto',
    });
  };

  const openQuestionForActiveGroup = () => {
    if (activeGroupId == null) return;
    setAddingQuestionForGroup(activeGroupId);
  };

  if (test.skill === 'WRITING') return <TestEditWritingContent test={test} />;
  if (test.skill === 'SPEAKING') return <TestEditSpeakingContent test={test} onBeforeSaveBasicInfo={onBeforeSaveBasicInfo} />;

  if (!stimulus) return <p className="py-8 text-center text-gray-400">Bai thi chua co noi dung</p>;
  const totalQuestions = stimulus.questionGroups.reduce((sum, group) => sum + group.questions.length, 0);

  return (
    <div className="flex h-[calc(100vh-100px)] min-h-0 flex-col gap-3 overflow-hidden pb-4">
      {test.stimuli.length > 1 && (
        <div className="flex shrink-0 flex-wrap gap-1">
          {test.stimuli.map((item, index) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setActiveStimulus(index);
                setPendingEvidence(null);
                setAddingGroup(false);
              }}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                index === activeStimulus ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {item.title || `Passage ${index + 1}`}
            </button>
          ))}
        </div>
      )}

      <div ref={layoutRef} className="flex min-h-0 flex-1 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <section
          className="flex min-h-0 shrink-0 flex-col overflow-hidden border-r border-gray-200 bg-slate-50/70"
          style={{ flexBasis: `${leftPaneWidth}%` }}
        >
          <div className="shrink-0 border-b border-gray-200 bg-white/90 px-4 py-3 backdrop-blur">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h4 className="text-sm font-semibold text-gray-800">{stimulus.title || (test.skill === 'LISTENING' ? 'Bai nghe' : 'Bai doc')}</h4>
                <p className="text-xs text-gray-500">{test.skill === 'LISTENING' ? 'Transcript / âm thanh' : 'Đoạn văn đối chiếu'}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {editingPassage ? (
                  <>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-8 gap-1 text-xs"
                      onClick={() => {
                        setEditingPassage(false);
                        setPassageEdit(stimulus.content || '');
                        setAudioUrlEdit(stimulus.mediaUrl || '');
                      }}
                    >
                      Huy
                    </Button>
                    <Button type="button" size="sm" className="h-8 gap-1 text-xs" disabled={savingPassage} onClick={handleSavePassage}>
                      {savingPassage ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                      Luu de
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-8 gap-1 text-xs"
                              onClick={() => {
                                setPassageEdit(stimulus.content || '');
                                setAudioUrlEdit(stimulus.mediaUrl || '');
                                setEditingPassage(true);
                              }}
                    >
                      <Pencil className="h-3 w-3" /> Sua de
                    </Button>
                    <Button type="button" size="sm" variant="outline" className="h-8 gap-1 text-xs" onClick={captureSelection}>
                      <Highlighter className="h-3 w-3" /> Quet dan chung
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 [scrollbar-gutter:stable]">
            {test.skill === 'LISTENING' && editingPassage ? (
              <div className="mb-3 space-y-2">
                <label className="text-xs font-medium text-gray-600">Audio URL</label>
                {audioUrlEdit ? (
                  <div className="space-y-1">
                    <audio controls src={audioUrlEdit} className="h-8 w-full" />
                    <button type="button" onClick={() => setAudioUrlEdit('')} className="text-xs text-red-500 hover:text-red-700">
                      Xoa audio
                    </button>
                  </div>
                ) : (
                  <MediaUploadZone onUploaded={(url) => setAudioUrlEdit(url)} />
                )}
              </div>
            ) : null}

            {test.skill === 'LISTENING' && !editingPassage && stimulus.mediaUrl ? (
              <div className="mb-3 rounded-lg border border-purple-200 bg-purple-50 p-2">
                <audio controls src={stimulus.mediaUrl} className="h-8 w-full" />
              </div>
            ) : null}

            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <h4 className="text-sm font-semibold text-gray-700">Passage / Transcript</h4>
                {!editingPassage && <div className="text-xs text-gray-400">{totalQuestions} cau</div>}
              </div>

              {editingPassage ? (
                <PassageEditor value={passageEdit} onChange={setPassageEdit} />
              ) : (
                <div
                  ref={passageRef}
                  className="max-h-none overflow-y-scroll rounded-lg border border-gray-300 bg-white px-5 py-4 text-sm leading-relaxed select-text prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: stimulus.content || '<p class="text-gray-400 italic">Chua co noi dung de bai.</p>' }}
                />
              )}

              {!editingPassage && pendingEvidence && (
                <div className="mt-3 rounded-md border border-green-300 bg-green-50 px-3 py-2">
                  <p className="mb-1 text-xs font-medium text-green-700">Da quet - chon cau ben trai de gan:</p>
                  <p className="line-clamp-3 text-xs text-green-800">&ldquo;{pendingEvidence}&rdquo;</p>
                  <button type="button" onClick={() => setPendingEvidence(null)} className="mt-1 text-xs text-green-500 hover:text-green-700">
                    Huy
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
                <p className="text-xs text-gray-500">{totalQuestions} câu hỏi trong {groupMeta.length} nhóm</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button type="button" size="sm" variant="outline" className="h-8 gap-1 border-dashed text-xs" onClick={() => setAddingGroup(true)}>
                  <Plus className="h-3.5 w-3.5" /> Thêm mới nhóm câu hỏi
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-8 gap-1 border-dashed text-xs"
                  onClick={openQuestionForActiveGroup}
                  disabled={activeGroupId == null}
                >
                  <Plus className="h-3.5 w-3.5" /> Thêm câu hỏi cho nhóm đang focus
                </Button>
              </div>
            </div>
          </div>

          <div className="shrink-0 border-b border-gray-200 bg-slate-50 px-4 py-3">
            <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-gutter:stable]">
              {groupMeta.map(({ group, invalid, label, questionCount }, index) => {
                const active = activeGroupId === group.id;
                return (
                  <button
                    key={group.id}
                    type="button"
                    onClick={() => scrollToGroup(group.id)}
                    className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                      active ? 'border-blue-600 bg-blue-600 text-white' : 'border-gray-200 bg-white text-gray-600 hover:border-blue-300 hover:text-blue-700'
                    }`}
                  >
                    <span>{`Nhóm ${index + 1}`}</span>
                    <span className={`rounded-full px-1.5 py-0.5 text-[10px] ${active ? 'bg-white/20' : 'bg-gray-100 text-gray-500'}`}>
                      {questionCount}
                    </span>
                    <span className="max-w-44 truncate">{label}</span>
                    {invalid && <AlertTriangle className={`h-3.5 w-3.5 ${active ? 'text-white' : 'text-red-500'}`} />}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="shrink-0 border-b border-gray-200 bg-white px-4 py-3">
            <div className="flex items-center gap-2 overflow-x-auto pb-1 [scrollbar-gutter:stable]">
              {questionMiniMap.map(({ questionId, groupId, number }, index) => {
                const isActive = activeQuestionId === questionId;
                const prev = questionMiniMap[index - 1];
                const showSeparator = index > 0 && prev?.groupId !== groupId;
                return (
                  <span key={questionId} className="flex items-center gap-2 shrink-0">
                    {showSeparator && <span className="text-gray-300 text-[10px] select-none">•</span>}
                    <button
                      type="button"
                      onClick={() => scrollToQuestion(questionId)}
                      className={`flex h-8 min-w-8 items-center justify-center rounded-md border px-2 text-xs font-medium transition-colors ${
                        isActive
                          ? 'border-blue-600 bg-blue-600 text-white'
                          : 'border-gray-200 bg-white text-gray-700 hover:border-blue-300 hover:text-blue-700'
                      }`}
                    >
                      {number}
                    </button>
                  </span>
                );
              })}
            </div>
          </div>

          <div ref={rightScrollRef} className="min-h-0 flex-1 overflow-y-scroll px-4 py-4 [scrollbar-gutter:stable]">
            <div className="space-y-4">
              {groupMeta.map(({ group, typeCode, invalid }, index) => {
                  const isMatchingHeadings = typeCode === 'MATCHING_HEADINGS';
                  const isActive = activeGroupId === group.id;
                  const questionOrder = questionOrders[group.id] ?? group.questions
                    .slice()
                    .sort((a, b) => a.position - b.position)
                    .map((question) => question.id);
                  const questionById = new Map(group.questions.map((question) => [question.id, question]));
                  const orderedQuestions = questionOrder.map((questionId) => questionById.get(questionId)).filter((question): question is typeof group.questions[number] => !!question);
                  const canDragQuestions = !['MATCHING_HEADINGS', 'MATCHING_INFORMATION', 'MATCHING_FEATURE'].includes(typeCode);

                  return (
                    <section
                      key={group.id}
                      ref={(el) => {
                        groupRefs.current[group.id] = el;
                      }}
                      data-group-id={group.id}
                      draggable
                      onDragStart={() => setDragState({ kind: 'group', groupId: group.id, itemId: group.id })}
                      onDragOver={(event) => {
                        event.preventDefault();
                        if (dragState?.kind === 'group') setDropHint({ kind: 'group', groupId: group.id, itemId: group.id });
                      }}
                      onDragEnd={() => {
                        setDragState(null);
                        setDropHint(null);
                      }}
                      onDrop={async (event) => {
                        event.preventDefault();
                        if (dragState?.kind === 'group' && dragState.itemId !== group.id) {
                          const from = groupOrder.indexOf(dragState.itemId);
                          const to = groupOrder.indexOf(group.id);
                          if (from >= 0 && to >= 0) {
                            await persistGroupOrder(moveItem(groupOrder, from, to));
                          }
                        }
                        setDragState(null);
                        setDropHint(null);
                      }}
                      className={`rounded-2xl border bg-white shadow-sm transition-shadow ${isActive ? 'border-blue-300 shadow-blue-100' : 'border-gray-200'} ${dropHint?.kind === 'group' && dropHint.itemId === group.id ? 'ring-2 ring-blue-400' : ''}`}
                    >
                      <div className={`border-b px-4 py-3 ${isActive ? 'bg-blue-50/70' : 'bg-gray-50'}`}>
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            draggable
                            onDragStart={() => setDragState({ kind: 'group', groupId: group.id, itemId: group.id })}
                            className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-gray-200 bg-white text-gray-400 cursor-grab active:cursor-grabbing"
                            title="Drag group"
                          >
                            <GripVertical className="h-3.5 w-3.5" />
                          </button>
                          <span className="rounded-full bg-blue-600 px-2.5 py-0.5 text-xs font-semibold text-white">Nhóm {index + 1}</span>
                          <span className="text-xs font-medium text-gray-700">{getQuestionRangeLabel(group, index)}</span>
                          <span className="text-xs text-gray-400">{TYPE_LABELS[typeCode] || typeCode}</span>
                          {invalid && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-medium text-red-600">
                              <AlertTriangle className="h-3 w-3" /> Chưa hoàn chỉnh
                            </span>
                          )}
                        </div>
                        {group.instruction && <p className="mt-2 text-xs italic text-gray-500">{group.instruction}</p>}
                      </div>

                      <div className="space-y-3 px-4 py-4">
                        {editingGroupId === group.id && (
                          <GroupEditForm
                            groupId={group.id}
                            typeCode={groupDrafts[group.id]?.typeCode || typeCode}
                            instruction={groupDrafts[group.id]?.instruction ?? group.instruction ?? ''}
                            groupContent={groupDrafts[group.id]?.groupContent || ''}
                            onChange={(draft) =>
                              setGroupDrafts((prev) => ({
                                ...prev,
                                [group.id]: draft,
                              }))
                            }
                            onCancel={() => setEditingGroupId(null)}
                            onSave={() => handleSaveGroup(group.id)}
                          />
                        )}

                        {typeCode === 'DIAGRAM_LABEL' && <DiagramImageSection groupId={group.id} imageUrl={group.imageUrl} testId={testId} />}

                        {isMatchingHeadings ? (
                          <TestEditMatchingHeadings
                            questions={group.questions}
                            passageHtml={stimulus.content || ''}
                            testId={testId}
                            pendingEvidence={pendingEvidence}
                            onAssignEvidence={() => setPendingEvidence(null)}
                            onEvidenceChange={handleEvidenceChange}
                          />
                        ) : typeCode === 'MATCHING_INFORMATION' ? (
                          <TestEditMatchingInformation
                            questions={group.questions}
                            passageHtml={stimulus.content || ''}
                            testId={testId}
                            pendingEvidence={pendingEvidence}
                            onAssignEvidence={() => setPendingEvidence(null)}
                            onEvidenceChange={handleEvidenceChange}
                          />
                        ) : typeCode === 'MATCHING_FEATURE' ? (
                          <TestEditMatchingFeature
                            questions={group.questions}
                            testId={testId}
                            pendingEvidence={pendingEvidence}
                            onAssignEvidence={() => setPendingEvidence(null)}
                            onEvidenceChange={handleEvidenceChange}
                          />
                        ) : typeCode === 'GAP_FILLING' ? (
                          <TestEditGapFilling
                            questions={orderedQuestions}
                            groupId={group.id}
                            groupContent={group.groupContent}
                            testId={testId}
                            pendingEvidence={pendingEvidence}
                            onAssignEvidence={() => setPendingEvidence(null)}
                            onEvidenceChange={handleEvidenceChange}
                          />
                        ) : (
                          <div className="space-y-2">
                            {orderedQuestions.map((question) => (
                              <div
                                key={question.id}
                                id={`question-${question.id}`}
                                data-question-id={question.id}
                                className={`group/q relative ${canDragQuestions ? 'cursor-grab' : ''} ${
                                  activeQuestionId === question.id ? 'ring-2 ring-blue-400 rounded-lg' : ''
                                } ${dropHint?.kind === 'question' && dropHint.itemId === question.id ? 'ring-2 ring-blue-400 rounded-lg' : ''}`}
                                draggable={canDragQuestions}
                                onDragStart={() => canDragQuestions && setDragState({ kind: 'question', groupId: group.id, itemId: question.id })}
                                onDragOver={(event) => {
                                  if (!canDragQuestions) return;
                                  event.preventDefault();
                                  if (dragState?.kind === 'question' && dragState.groupId === group.id) {
                                    setDropHint({ kind: 'question', groupId: group.id, itemId: question.id });
                                  }
                                }}
                                onDragEnd={() => {
                                  setDragState(null);
                                  setDropHint(null);
                                }}
                                onDrop={async (event) => {
                                  if (!canDragQuestions) return;
                                  event.preventDefault();
                                  if (dragState?.kind === 'question' && dragState.groupId === group.id && dragState.itemId !== question.id) {
                                    const from = questionOrder.indexOf(dragState.itemId);
                                    const to = questionOrder.indexOf(question.id);
                                    if (from >= 0 && to >= 0) {
                                      await persistQuestionOrder(group.id, moveItem(questionOrder, from, to));
                                    }
                                  }
                                  setDragState(null);
                                  setDropHint(null);
                                }}
                              >
                                <TestEditQuestionCard
                                  question={question}
                                  questionTypeCode={typeCode}
                                  displayPosition={questionDisplayPositions.get(question.id)}
                                  testId={testId}
                                  pendingEvidence={pendingEvidence}
                                  onAssignEvidence={() => setPendingEvidence(null)}
                                  onEvidenceChange={(evidence) => handleEvidenceChange(question.id, evidence)}
                                />
                                <button
                                  type="button"
                                  onClick={() => handleDeleteQuestion(question.id)}
                                  title="Delete question"
                                  className="absolute right-2 top-2 hidden text-gray-300 hover:text-red-500 group-hover/q:block"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}

                        {addingQuestionForGroup === group.id && (
                          <div className="pt-1">
                            <TestEditAddQuestionForm
                              groupId={group.id}
                              questionTypeCode={typeCode}
                              testId={testId}
                              nextPosition={Math.max(...orderedQuestions.map((question) => question.position), 0) + 1}
                              onClose={() => setAddingQuestionForGroup(null)}
                            />
                          </div>
                        )}

                      </div>
                    </section>
                  );
                })}

                        {addingGroup ? (
                  <TestEditAddQuestionGroupForm
                    stimulusId={stimulus.id}
                    testId={testId}
                    stimulusContent={stimulus.content || ''}
                    excludeTypeCodes={stimulus.questionGroups.map((group) => ((group.questionTypeCode as QuestionTypeCode) || inferQuestionType(group)))}
                    pendingEvidence={pendingEvidence}
                    onAssignEvidence={() => setPendingEvidence(null)}
                    onClose={() => setAddingGroup(false)}
                  />
                ) : (
                  <Button type="button" size="sm" variant="outline" className="h-10 w-full gap-1 border-dashed text-xs" onClick={() => setAddingGroup(true)}>
                    <Plus className="h-3.5 w-3.5" /> Thêm mới nhóm câu hỏi
                  </Button>
                )}
              </div>
          </div>
        </section>
      </div>

      {isResizing && <div className="fixed inset-0 z-10 cursor-col-resize bg-transparent" />}

      <ConfirmDialog
        open={!!pendingDelete}
        onOpenChange={(open) => {
          if (!open) cancelDelete();
        }}
        title={pendingDelete?.type === 'group' ? 'Delete question group?' : 'Delete question?'}
        description={pendingDelete?.type === 'group' ? 'All questions in this group will be deleted.' : 'This question will be deleted permanently.'}
        variant="destructive"
        onConfirm={confirmDelete}
      />
    </div>
  );
}
