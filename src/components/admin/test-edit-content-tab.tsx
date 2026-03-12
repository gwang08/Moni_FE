'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Highlighter, Plus, Trash2 } from 'lucide-react';
import { TestEditQuestionCard } from '@/components/admin/test-edit-question-card';
import { TestEditMatchingHeadings } from '@/components/admin/test-edit-matching-headings';
import { TestEditAddQuestionGroupForm } from '@/components/admin/test-edit-add-question-group-form';
import { TestEditAddQuestionForm } from '@/components/admin/test-edit-add-question-form';
import { useTestEditMutations } from '@/components/admin/use-test-edit-mutations';
import { applyHighlights, type EvidenceEntry } from '@/components/admin/test-edit-highlight-evidence';
import type { TestDetailResponse, QuestionGroupDetail } from '@/types/test.types';
import type { QuestionTypeCode } from '@/types/admin.types';

function inferQuestionType(group: QuestionGroupDetail): QuestionTypeCode {
  const q = group.questions[0];
  if (!q || !q.options.length) return 'GAP_FILLING';
  const opts = q.options;
  if (opts.length === 3) {
    const labels = opts.map(o => (o.label || o.content).toLowerCase());
    if (labels.some(l => l === 'true' || l === 'false')) return 'TFNG';
    if (labels.some(l => l === 'yes' || l === 'no')) return 'YNNG';
  }
  if (opts.length >= 2 && opts.length <= 5 && opts.some(o => ['A', 'B', 'C', 'D', 'E'].includes(o.label))) return 'MCQ';
  if (opts.length === 1 && opts[0].isCorrect) return 'GAP_FILLING';
  return 'MCQ';
}

const TYPE_LABELS: Record<string, string> = {
  MCQ: 'Multiple Choice', MCQ_MULTIPLE: 'Multiple Choice',
  TFNG: 'True / False / Not Given', YNNG: 'Yes / No / Not Given',
  MATCHING_HEADINGS: 'Matching Headings', MATCHING_INFORMATION: 'Matching Information',
  MATCHING_FEATURE: 'Matching Features', DIAGRAM_LABEL: 'Map, Diagram Label',
  GAP_FILLING: 'Gap Filling',
};

interface Props { test: TestDetailResponse }

export function TestEditContentTab({ test }: Props) {
  const testId = String(test.id);
  const { handleDeleteGroup, handleDeleteQuestion } = useTestEditMutations(testId);
  const [activeStimulus, setActiveStimulus] = useState(0);
  const [pendingEvidence, setPendingEvidence] = useState<string | null>(null);
  const pendingOffsetRef = useRef(-1);
  const [evidenceMap, setEvidenceMap] = useState<Record<number, string>>(() => {
    const map: Record<number, string> = {};
    for (const s of test.stimuli) for (const g of s.questionGroups) for (const q of g.questions) {
      if (q.explanation?.evidence) map[q.id] = q.explanation.evidence;
    }
    return map;
  });
  const [offsetMap, setOffsetMap] = useState<Record<number, number>>({});
  const passageRef = useRef<HTMLDivElement>(null);
  const stimulus = test.stimuli[activeStimulus];

  // CRUD toggle state
  const [addingGroup, setAddingGroup] = useState(false);
  const [addingQuestionForGroup, setAddingQuestionForGroup] = useState<number | null>(null);

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

  const handleEvidenceChange = useCallback((questionId: number, evidence: string) => {
    if (evidence) {
      setEvidenceMap(prev => ({ ...prev, [questionId]: evidence }));
      setOffsetMap(prev => ({ ...prev, [questionId]: pendingOffsetRef.current }));
    } else {
      setEvidenceMap(prev => { const n = { ...prev }; delete n[questionId]; return n; });
      setOffsetMap(prev => { const n = { ...prev }; delete n[questionId]; return n; });
    }
  }, []);

  const allEvidences = useMemo((): EvidenceEntry[] => {
    if (!stimulus) return [];
    const qIds = stimulus.questionGroups.flatMap(g => g.questions.map(q => q.id));
    return qIds.filter(id => evidenceMap[id]).map(id => ({ text: evidenceMap[id], offset: offsetMap[id] ?? -1 }));
  }, [stimulus, evidenceMap, offsetMap]);

  const passageContent = stimulus?.content || '';
  useEffect(() => {
    const el = passageRef.current;
    if (!el) return;
    el.innerHTML = passageContent;
    applyHighlights(el, allEvidences);
  }, [passageContent, allEvidences]);

  if (!stimulus) return <p className="text-center text-gray-400 py-8">Bài thi chưa có nội dung</p>;
  const totalQuestions = stimulus.questionGroups.reduce((sum, g) => sum + g.questions.length, 0);

  return (
    <div className="space-y-3">
      {test.stimuli.length > 1 && (
        <div className="flex gap-1">
          {test.stimuli.map((s, i) => (
            <button key={s.id} type="button"
              onClick={() => { setActiveStimulus(i); setPendingEvidence(null); setAddingGroup(false); setAddingQuestionForGroup(null); }}
              className={`px-3 py-1.5 text-xs rounded-md font-medium transition-colors ${
                i === activeStimulus ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >{s.title || `Passage ${i + 1}`}</button>
          ))}
        </div>
      )}

      <div className="flex gap-0 h-[calc(100vh-220px)]">
        <div className="w-1/2 overflow-y-auto border-r border-gray-200 pr-4 pb-4 space-y-3">
          <div className="sticky top-0 bg-gray-50 py-2 z-10">
            <h4 className="text-sm font-semibold text-gray-700">
              Câu hỏi <span className="text-xs font-normal text-gray-500">({totalQuestions} câu)</span>
            </h4>
          </div>
          {stimulus.questionGroups.map((group, gi) => {
            const typeCode = (group.questionTypeCode as QuestionTypeCode) || inferQuestionType(group);
            const isMatchingHeadings = typeCode === 'MATCHING_HEADINGS';
            return (
              <div key={group.id}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">Nhóm {gi + 1}</span>
                  <span className="text-xs text-gray-400">{TYPE_LABELS[typeCode] || typeCode} · {group.questions.length} câu</span>
                  <button type="button" onClick={() => handleDeleteGroup(group.id)} title="Xóa nhóm"
                    className="ml-auto text-gray-300 hover:text-red-500 transition-colors">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
                {group.instruction && <p className="text-xs text-gray-500 italic mb-2">{group.instruction}</p>}
                {isMatchingHeadings ? (
                  <TestEditMatchingHeadings questions={group.questions} passageHtml={stimulus.content || ''} testId={testId}
                    pendingEvidence={pendingEvidence} onAssignEvidence={() => setPendingEvidence(null)} onEvidenceChange={handleEvidenceChange} />
                ) : (
                  <div className="space-y-2">
                    {group.questions.map(question => (
                      <div key={question.id} className="relative group/q">
                        <TestEditQuestionCard question={question} questionTypeCode={typeCode} testId={testId}
                          pendingEvidence={pendingEvidence} onAssignEvidence={() => setPendingEvidence(null)}
                          onEvidenceChange={(ev) => handleEvidenceChange(question.id, ev)} />
                        <button type="button" onClick={() => handleDeleteQuestion(question.id)} title="Xóa câu"
                          className="absolute top-2 right-2 hidden group-hover/q:block text-gray-300 hover:text-red-500">
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                {/* Add question button */}
                {addingQuestionForGroup === group.id ? (
                  <div className="mt-2">
                    <TestEditAddQuestionForm groupId={group.id} questionTypeCode={typeCode} testId={testId}
                      nextPosition={group.questions.length + 1} onClose={() => setAddingQuestionForGroup(null)} />
                  </div>
                ) : (
                  <button type="button" onClick={() => setAddingQuestionForGroup(group.id)}
                    className="mt-2 flex items-center gap-1 text-xs text-blue-500 hover:text-blue-700 transition-colors">
                    <Plus className="h-3 w-3" /> Thêm câu hỏi
                  </button>
                )}
              </div>
            );
          })}

          {/* Add question group — only show types not already present */}
          {addingGroup ? (
            <TestEditAddQuestionGroupForm stimulusId={stimulus.id} testId={testId}
              excludeTypeCodes={stimulus.questionGroups.map(g => ((g.questionTypeCode as QuestionTypeCode) || inferQuestionType(g)))}
              onClose={() => setAddingGroup(false)} />
          ) : (
            <Button type="button" size="sm" variant="outline" className="w-full text-xs h-8 gap-1 border-dashed"
              onClick={() => setAddingGroup(true)}>
              <Plus className="h-3.5 w-3.5" /> Thêm nhóm câu hỏi
            </Button>
          )}
        </div>

        <div className="w-1/2 flex flex-col pl-4">
          <div className="flex items-center justify-between py-2">
            <h4 className="text-sm font-semibold text-gray-700">{stimulus.title || 'Bài đọc / Bài nghe'}</h4>
            <Button type="button" size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={captureSelection}>
              <Highlighter className="h-3 w-3" /> Quét dẫn chứng
            </Button>
          </div>
          <div ref={passageRef}
            className="flex-1 overflow-y-auto rounded-lg border border-gray-300 bg-white px-5 py-4 text-sm text-gray-800 leading-relaxed cursor-text select-text prose prose-sm max-w-none" />
          {pendingEvidence && (
            <div className="mt-2 rounded-md border border-green-300 bg-green-50 px-3 py-2">
              <p className="text-xs font-medium text-green-700 mb-1">Đã quét — chọn câu bên trái để gán:</p>
              <p className="text-xs text-green-800 line-clamp-3">&ldquo;{pendingEvidence}&rdquo;</p>
              <button type="button" onClick={() => setPendingEvidence(null)} className="text-xs text-green-500 hover:text-green-700 mt-1">Hủy</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
