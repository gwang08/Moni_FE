'use client';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Highlighter, ChevronDown, ChevronUp, Plus, Trash2 } from 'lucide-react';
import type { QuestionRequest } from '@/types/admin.types';

interface Props {
  paragraphs: string[];
  questions: QuestionRequest[];
  pendingEvidence: string | null;
  onAssignEvidence: (qi: number) => void;
  onChange: (questions: QuestionRequest[]) => void;
}

export function MatchingInformationEditor({ paragraphs, questions, pendingEvidence, onAssignEvidence, onChange }: Props) {
  const rebuild = (stmts: { content: string; correctPara: string; explanation?: QuestionRequest['explanation'] }[]) => {
    const newQuestions: QuestionRequest[] = stmts.map(s => ({
      content: s.content,
      options: paragraphs.map(p => ({ label: p, content: p, isCorrect: p === s.correctPara })),
      explanation: s.explanation,
    }));
    onChange(newQuestions);
  };

  // Derive current state from questions
  const statements = questions.map(q => {
    const correct = q.options.find(o => o.isCorrect);
    return {
      content: q.content,
      correctPara: correct?.label ?? paragraphs[0] ?? 'A',
      explanation: q.explanation,
    };
  });

  const updateStatement = (idx: number, patch: Partial<typeof statements[0]>) => {
    rebuild(statements.map((s, i) => i === idx ? { ...s, ...patch } : s));
  };

  const addStatement = () => {
    rebuild([...statements, { content: '', correctPara: paragraphs[0] ?? 'A' }]);
  };

  const removeStatement = (idx: number) => {
    rebuild(statements.filter((_, i) => i !== idx));
  };

  if (paragraphs.length === 0) {
    return (
      <div className="border-2 border-dashed border-amber-200 rounded-lg p-4 text-center">
        <p className="text-xs text-amber-600">Passage has no paragraphs (A, B, C...).</p>
        <p className="text-xs text-gray-400 mt-1">Go to step 2 and mark paragraphs with &quot;A.&quot;, &quot;B.&quot;...</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="text-xs text-gray-400">Paragraphs: {paragraphs.join(', ')}</div>

      <div className="rounded-lg border border-gray-200 overflow-hidden divide-y divide-gray-100">
        <div className="grid grid-cols-[32px_1fr_60px_28px] bg-gray-50 px-3 py-2 text-xs font-medium text-gray-500">
          <span>#</span><span>Statement</span><span>Para</span><span />
        </div>
        {statements.map((stmt, i) => {
          const expl = stmt.explanation;
          const hasDetail = !!(expl?.text || expl?.evidence);
          return (
            <div key={i} className="bg-white">
              <div className="grid grid-cols-[32px_1fr_60px_28px] items-center px-3 py-2 gap-1">
                <span className="text-xs font-bold text-blue-600">{i + 1}</span>
                <Input
                  value={stmt.content}
                  onChange={e => updateStatement(i, { content: e.target.value })}
                  placeholder="Statement content..."
                  className="text-sm h-8"
                />
                <select
                  value={stmt.correctPara}
                  onChange={e => updateStatement(i, { correctPara: e.target.value })}
                  className="rounded-md border border-input bg-background px-1.5 py-1 text-sm h-8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {paragraphs.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
                {statements.length > 1 ? (
                  <button type="button" onClick={() => removeStatement(i)} className="text-gray-300 hover:text-red-500 flex items-center justify-center h-7 w-7">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                ) : <span />}
              </div>
            </div>
          );
        })}
      </div>

      <Button type="button" size="sm" variant="outline" className="text-xs h-7 gap-1" onClick={addStatement}>
        <Plus className="h-3 w-3" /> Add question
      </Button>
    </div>
  );
}
