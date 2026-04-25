// Chuẩn hoá dữ liệu evaluation từ backend (AI hoặc Expert format) thành shape thống nhất cho UI

/* eslint-disable @typescript-eslint/no-explicit-any */

export interface NormalisedCriterion {
  key: string;
  label: string;
  band: number;
  justification?: string;
  strengths?: string[];
  weaknesses?: string[];
  violations?: Record<string, unknown>;
}

export interface NormalisedImprovement {
  criterion: string;
  issue_type?: string;
  original_sentence?: string;
  improved_sentence?: string;
  reason?: string;
}

export interface NormalisedData {
  overall: number;
  criteria: NormalisedCriterion[];
  improvements: NormalisedImprovement[];
  overall_strategy?: string;
  summary?: string;
  strengths?: string;
  feedbackImprovements?: string;
  feedbackSkipped?: boolean;
  feedbackSkipReason?: string;
}

export function getCritMeta(taskType?: number) {
  const taLabel = taskType === 1 ? 'Task Achievement' : 'Task Response';
  const taShort = taskType === 1 ? 'TA' : 'TR';
  return [
    { key: 'TR', altKeys: ['TA'], label: taLabel, short: taShort },
    { key: 'CC', altKeys: ['CC'], label: 'Coherence & Cohesion', short: 'CC' },
    { key: 'LR', altKeys: ['LR'], label: 'Lexical Resource', short: 'LR' },
    { key: 'GRA', altKeys: ['GRA'], label: 'Grammatical Range', short: 'GRA' },
  ];
}

export const CRIT_META = getCritMeta();

function dig(o: any, ...paths: string[]): number {
  for (const p of paths) {
    let v: any = o;
    for (const k of p.split('.')) v = v?.[k];
    if (typeof v === 'number') return v;
  }
  return 0;
}

// Loại bỏ chuỗi trông giống JSON leak hoặc marker compiled feedback legacy
export function cleanFeedback(text: any): string | undefined {
  if (typeof text !== 'string') return undefined;
  const trimmed = text.trim();
  if (!trimmed) return undefined;
  if (trimmed.startsWith('{') || trimmed.startsWith('[{') || trimmed.startsWith('[[')) return undefined;
  if (trimmed.includes('"criterion":') || trimmed.includes('"reason":')) return undefined;
  return trimmed
    .replace(/^\[NHẬN XÉT CHUNG\]\s*/i, '')
    .replace(/\n\n\[ĐÁNH GIÁ CHI TIẾT\][\s\S]*$/i, '')
    .trim() || undefined;
}

export function normalise(raw: Record<string, unknown>, taskType?: number): NormalisedData {
  const isFormatB = 'overallScore' in raw || 'analysisResult' in raw || 'feedbackResponse' in raw;

  const overall = isFormatB
    ? dig(raw, 'overallScore', 'overallBand')
    : dig(raw, 'assessment.final_band', 'final_band', 'overallBand');

  const critSource: any = isFormatB
    ? ((raw as any)?.analysisResult?.criteria || (raw as any)?.criteria)
    : ((raw as any)?.assessment?.criteria || (raw as any)?.criteria);

  const critMeta = getCritMeta(taskType);
  const criteria: NormalisedCriterion[] = critMeta.map(({ key, altKeys, label, short }) => {
    const cObj: any = critSource?.[key] ?? altKeys.reduce((acc: any, k) => acc ?? critSource?.[k], undefined);
    const band = Number(cObj?.adjusted_band ?? cObj?.band ?? 0);
    return {
      key: short,
      label,
      band,
      justification: cObj?.justification as string | undefined,
      strengths: Array.isArray(cObj?.strengths) ? (cObj.strengths as string[]) : undefined,
      weaknesses: Array.isArray(cObj?.weaknesses) ? (cObj.weaknesses as string[]) : undefined,
      violations: cObj?.violations as Record<string, unknown> | undefined,
    };
  });

  const fbObj: any = isFormatB ? (raw?.feedbackResponse || raw) : (raw?.feedback || raw);

  let improvements: NormalisedImprovement[] = [];
  if (Array.isArray(fbObj?.improvements)) {
    improvements = fbObj.improvements;
  } else if (typeof fbObj?.improvements === 'string' && fbObj.improvements.trim().startsWith('[')) {
    try {
      const parsed = JSON.parse(fbObj.improvements);
      if (Array.isArray(parsed)) improvements = parsed;
    } catch {
      /* ignore */
    }
  }

  return {
    overall,
    criteria,
    improvements,
    overall_strategy: cleanFeedback(fbObj?.overall_strategy),
    summary: cleanFeedback(fbObj?.summary),
    strengths: cleanFeedback(fbObj?.strengths),
    feedbackImprovements: cleanFeedback(fbObj?.improvements),
    feedbackSkipped: fbObj?.skipped === true,
    feedbackSkipReason: typeof fbObj?.reason === 'string' ? fbObj.reason : undefined,
  };
}
