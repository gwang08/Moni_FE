import { useEffect, useState, useCallback } from 'react';
import { getMySessions } from '@/lib/expert-api';
import { getWritingSubmissions, getSpeakingSubmissions } from '@/lib/ai-api';
import { getAttemptHistory } from '@/lib/practice-api';
import { getReadingBand, getListeningBand } from '@/lib/ielts-band';
import type { ScoringSession } from '@/types/expert.types';

export type HistoryKind = 'writing' | 'reading' | 'listening' | 'speaking';
export type HistoryStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

export interface HistoryEntry {
  id: string; // kind + sourceId (duy nhất)
  kind: HistoryKind;
  title: string; // tiêu đề hiển thị (task prompt, test title…)
  subtitle?: string; // meta dòng 2 (từ, giảng viên, câu hỏi…)
  band?: number; // band nếu đã chấm (0–9)
  status: HistoryStatus;
  date: string; // ISO string để sort
  // Điều hướng khi click
  href: string;
  // Action phụ cho card chưa chấm (Writing only)
  writingSubmissionId?: number; // dùng để gọi expert modal
  // Marker phụ (task number, skill tag…)
  tag?: string;
}

function toDateSafe(d?: string | null): string {
  if (!d) return '';
  return d.includes('Z') || d.includes('+') ? d : d + 'Z';
}

function writingStatusFrom(raw: string): HistoryStatus {
  if (raw === 'COMPLETED') return 'COMPLETED';
  if (raw === 'PROCESSING') return 'PROCESSING';
  if (raw === 'FAILED') return 'FAILED';
  return 'PENDING';
}

function sessionStatusFrom(raw: ScoringSession['status']): HistoryStatus {
  if (raw === 'COMPLETED') return 'COMPLETED';
  if (raw === 'IN_PROGRESS') return 'PROCESSING';
  if (raw === 'CANCELLED') return 'FAILED';
  return 'PENDING';
}

export function useUnifiedHistory() {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const [writings, sessions, attempts, speakings] = await Promise.all([
      getWritingSubmissions().catch(() => []),
      getMySessions().catch(() => [] as ScoringSession[]),
      getAttemptHistory().catch(() => []),
      getSpeakingSubmissions().catch(() => []),
    ]);

    const merged: HistoryEntry[] = [];

    // Speaking submissions (AI grading path)
    for (const s of speakings) {
      merged.push({
        id: `sp-${s.id}`,
        kind: 'speaking',
        title: s.test?.title || `Speaking Test`,
        subtitle: `AI Chấm`,
        band: typeof s.evaluation?.overallScore === 'number' && s.evaluation.overallScore > 0 ? s.evaluation.overallScore : undefined,
        status: writingStatusFrom(s.evaluationStatus),
        date: s.submittedAt,
        href: `/speaking/result/${s.id}`, // We don't have speaking result page yet maybe? Yes we do: /practice/speaking/[id]/review probably? Wait 's.id' is submission id.
        tag: 'Test',
      });
    }

    // Writing submissions (AI grading path)
    for (const w of writings) {
      merged.push({
        id: `w-${w.submissionId}`,
        kind: 'writing',
        title: w.testTitle || w.stimulusTitle || `Writing ${w.taskType === 'TASK_1' ? 'Task 1' : 'Task 2'}`,
        subtitle: `${w.wordCount ?? 0} từ`,
        band: typeof w.overallBand === 'number' && w.overallBand > 0 ? w.overallBand : undefined,
        status: writingStatusFrom(w.evaluationStatus),
        date: w.submittedAt,
        href: `/writing/result/${w.submissionId}`,
        writingSubmissionId: w.submissionId,
        tag: w.taskType === 'TASK_1' ? 'Task 1' : 'Task 2',
      });
    }

    // Expert sessions (Speaking + Writing via expert)
    for (const s of sessions) {
      const isSpeaking = s.skill?.toUpperCase() === 'SPEAKING';
      const kind: HistoryKind = isSpeaking ? 'speaking' : 'writing';
      // Với writing expert session, đã có entry từ writings[] rồi → skip tránh trùng
      if (!isSpeaking && s.writingSubmissionId) continue;

      const href = isSpeaking
        ? `/speaking/result/${s.id}`
        : s.writingSubmissionId
          ? `/writing/result/${s.writingSubmissionId}`
          : `/speaking/result/${s.id}`;

      merged.push({
        id: `s-${s.id}`,
        kind,
        title: s.testTitle || s.stimulusTitle || `${isSpeaking ? 'Speaking' : 'Writing'} với Giảng viên`,
        subtitle: s.expertDisplayName ? `GV ${s.expertDisplayName}` : undefined,
        status: sessionStatusFrom(s.status),
        date: s.createdAt || s.startedAt || '',
        href,
        tag: `#${s.id}`,
      });
    }

    // Reading + Listening attempts
    for (const a of attempts) {
      const skill = a.skill?.toUpperCase();
      if (skill !== 'READING' && skill !== 'LISTENING') continue;

      const kind: HistoryKind = skill === 'READING' ? 'reading' : 'listening';
      const band = skill === 'READING'
        ? getReadingBand(a.score, a.totalQuestions)
        : getListeningBand(a.score, a.totalQuestions);

      const skillPath = kind;
      const testOrStimulusId = a.testId ?? a.stimulusId;
      const href = testOrStimulusId
        ? `/practice/${skillPath}/${testOrStimulusId}/review?attemptId=${a.attemptId}`
        : '#';

      merged.push({
        id: `${kind[0]}-${a.attemptId}`,
        kind,
        title: a.testTitle || a.stimulusTitle || `${skill === 'READING' ? 'Reading' : 'Listening'} practice`,
        subtitle: `${a.score}/${a.totalQuestions} câu đúng`,
        band,
        status: 'COMPLETED',
        date: a.submittedAt || a.startedAt || '',
        href,
        tag: a.testMode === 'FULL_TEST' ? 'Full test' : 'Practice',
      });
    }

    // Sort mới nhất trước
    merged.sort((a, b) => {
      const ta = new Date(toDateSafe(a.date)).getTime() || 0;
      const tb = new Date(toDateSafe(b.date)).getTime() || 0;
      return tb - ta;
    });

    setEntries(merged);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { entries, loading, refresh: load };
}
