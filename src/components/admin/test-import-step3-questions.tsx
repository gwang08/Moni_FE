'use client';

import { Button } from '@/components/ui/button';
import { Plus, Highlighter, Eye, PencilLine } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { QuestionGroupEditor } from '@/components/admin/test-import-question-group-editor';
import { applyHighlights, type EvidenceEntry } from '@/components/admin/test-edit-highlight-evidence';
import { ReadingQuestionsPanel } from '@/components/reading/reading-questions-panel';
import { mapStimulusRequestToDetail } from '@/components/admin/test-import-preview-mapper';
import type { StimulusRequest, QuestionGroupRequest } from '@/types/admin.types';

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

export function TestImportStep3({ stimuli, onChange, onNext, onBack }: Props) {
  const [activeStimulus, setActiveStimulus] = useState(0);
  const [isPreview, setIsPreview] = useState(false);
  const [pendingEvidence, setPendingEvidence] = useState<string | null>(null);
  const passageRef = useRef<HTMLDivElement>(null);
  const pendingOffsetRef = useRef(-1);
  const [offsetMap, setOffsetMap] = useState<Record<string, number>>({});

  const stimulus = stimuli[activeStimulus];

  const updateStimulus = (fn: (s: StimulusRequest) => StimulusRequest) =>
    onChange(stimuli.map((s, i) => (i === activeStimulus ? fn(s) : s)));

  const addGroup = () => updateStimulus(s => ({ ...s, questionGroups: [...s.questionGroups, emptyGroup()] }));
  const removeGroup = (gi: number) => updateStimulus(s => ({ ...s, questionGroups: s.questionGroups.filter((_, j) => j !== gi) }));
  const updateGroup = (gi: number, updated: QuestionGroupRequest) =>
    updateStimulus(s => ({ ...s, questionGroups: s.questionGroups.map((g, j) => (j === gi ? updated : g)) }));

  const getPositionOffset = (gi: number): number => {
    let offset = 0;
    for (let g = 0; g < gi; g++) offset += stimulus.questionGroups[g].questions.length;
    return offset;
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
    } catch { pendingOffsetRef.current = -1; }
    setPendingEvidence(text);
    selection.removeAllRanges();
  }, []);

  const assignEvidence = useCallback((_gi: number, _qi: number) => {
    setPendingEvidence(null);
  }, []);

  const isValid = stimuli.every(s =>
    s.questionGroups.length > 0 &&
    s.questionGroups.every(g =>
      g.questions.length > 0 &&
      g.questions.every(q => {
        const hasAnswer = q.options.some(o => o.isCorrect && o.content.trim());
        // Gap filling paragraph mode: content can be empty if groupContent + answer exist
        if (g.questionTypeCode === 'GAP_FILLING' && g.groupContent?.trim()) return hasAnswer;
        return q.content.trim() && q.options.some(o => o.isCorrect);
      })
    )
  );

  const allEvidences = useMemo((): EvidenceEntry[] => {
    if (!stimulus) return [];
    const entries: EvidenceEntry[] = [];
    stimulus.questionGroups.forEach((g, gi) => {
      g.questions.forEach((q, qi) => {
        if (q.explanation?.evidence) {
          entries.push({ text: q.explanation.evidence, offset: offsetMap[`${gi}-${qi}`] ?? -1 });
        }
      });
    });
    return entries;
  }, [stimulus, offsetMap]);

  const passageContent = stimulus?.content || '<p class="text-gray-400 italic">Chưa có nội dung. Quay lại bước 2 để nhập.</p>';

  // Manage innerHTML via ref — React never touches passage DOM, so highlights survive re-renders
  useEffect(() => {
    const el = passageRef.current;
    if (!el) return;
    el.innerHTML = passageContent;
    applyHighlights(el, allEvidences);
  }, [passageContent, allEvidences]);

  if (!stimulus) return null;

  return (
    <div className="space-y-3 pb-4">
      {/* Stimulus tabs */}
      {stimuli.length > 1 && (
        <div className="flex gap-1 px-2">
          {stimuli.map((_, i) => (
            <button key={i} type="button"
              onClick={() => { setActiveStimulus(i); setPendingEvidence(null); }}
              className={`px-3 py-1.5 text-xs rounded-md font-medium transition-colors ${
                i === activeStimulus ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Stimulus {i + 1}
            </button>
          ))}
        </div>
      )}

      {/* Full-width split: Questions LEFT | Passage RIGHT */}
      <div className="flex gap-0 h-[calc(100vh-180px)]">
        {/* LEFT: Questions (editor or preview) */}
        <div className="w-1/2 overflow-y-auto border-r border-gray-200 px-4 pb-4 space-y-3">
          <div className="flex items-center justify-between sticky top-0 bg-gray-50 py-2 z-10">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsPreview(false)}
                className={`flex items-center gap-1 px-3 py-1.5 text-xs rounded-md font-medium transition-colors ${
                  !isPreview ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <PencilLine className="h-3 w-3" /> Soạn câu hỏi
              </button>
              <button
                type="button"
                onClick={() => setIsPreview(true)}
                className={`flex items-center gap-1 px-3 py-1.5 text-xs rounded-md font-medium transition-colors ${
                  isPreview ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Eye className="h-3 w-3" /> Xem trước
              </button>
            </div>
            {!isPreview && (
              <Button size="sm" variant="outline" onClick={addGroup}>
                <Plus className="h-4 w-4" /> Thêm nhóm
              </Button>
            )}
            {isPreview && (
              <span className="text-xs text-gray-400 italic">Chế độ xem trước (chỉ đọc)</span>
            )}
          </div>

          {isPreview ? (
            stimulus.questionGroups.length === 0 ? (
              <div className="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center text-gray-400 text-sm">
                Chưa có câu hỏi nào để xem trước.
              </div>
            ) : (
              <ReadingQuestionsPanel
                stimulus={mapStimulusRequestToDetail(stimulus, activeStimulus)}
                submitted={true}
                answers={{}}
                onAnswer={() => {}}
                textAnswers={{}}
                onTextAnswer={() => {}}
              />
            )
          ) : (
            <>
              {stimulus.questionGroups.map((group, gi) => (
                <QuestionGroupEditor
                  key={gi}
                  group={group}
                  groupIndex={gi}
                  positionOffset={getPositionOffset(gi)}
                  stimulusContent={stimulus.content}
                  pendingEvidence={pendingEvidence}
                  onAssignEvidence={(qi) => assignEvidence(gi, qi)}
                  onChange={updated => updateGroup(gi, updated)}
                  onRemove={() => removeGroup(gi)}
                />
              ))}

              {stimulus.questionGroups.length === 0 && (
                <div className="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center text-gray-400 text-sm">
                  Nhấn &quot;Thêm nhóm&quot; để bắt đầu tạo câu hỏi.
                </div>
              )}
            </>
          )}
        </div>

        {/* RIGHT: Passage — no dangerouslySetInnerHTML, managed via ref */}
        <div className="w-1/2 flex flex-col px-4">
          <div className="flex items-center justify-between py-2">
            <h4 className="text-sm font-semibold text-gray-700">Bài đọc / Bài nghe</h4>
            <Button type="button" size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={captureSelection}>
              <Highlighter className="h-3 w-3" /> Quét dẫn chứng
            </Button>
          </div>

          <div
            ref={passageRef}
            className="flex-1 overflow-y-auto rounded-lg border border-gray-300 bg-white px-5 py-4 text-sm text-gray-800 leading-relaxed cursor-text select-text prose prose-sm max-w-none"
          />

          {pendingEvidence && (
            <div className="mt-2 rounded-md border border-green-300 bg-green-50 px-3 py-2">
              <p className="text-xs font-medium text-green-700 mb-1">Đã quét — chọn câu bên trái để gán:</p>
              <p className="text-xs text-green-800 line-clamp-3">&ldquo;{pendingEvidence}&rdquo;</p>
              <button type="button" onClick={() => setPendingEvidence(null)} className="text-xs text-green-500 hover:text-green-700 mt-1">Hủy</button>
            </div>
          )}
        </div>
      </div>

      {/* Bottom buttons */}
      <div className="flex justify-between px-4 pt-2">
        <Button variant="outline" onClick={onBack}>Quay lại</Button>
        <Button onClick={onNext} disabled={!isValid}>Xem lại & Nộp</Button>
      </div>
    </div>
  );
}
