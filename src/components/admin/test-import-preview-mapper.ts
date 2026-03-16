/**
 * Maps admin QuestionGroupRequest[] → StimulusDetail for read-only student preview.
 * Uses negative synthetic IDs so they never collide with real DB IDs.
 */
import type { QuestionGroupRequest, StimulusRequest } from '@/types/admin.types';
import type { StimulusDetail, QuestionGroupDetail, QuestionDetail, OptionDetail } from '@/types/test.types';

export function mapGroupRequestToDetail(group: QuestionGroupRequest, groupIndex: number, positionOffset: number): QuestionGroupDetail {
  const questions: QuestionDetail[] = group.questions.map((q, qi) => {
    const options: OptionDetail[] = q.options.map((o, oi) => ({
      id: -(groupIndex * 10000 + qi * 100 + oi + 1),
      label: o.label ?? String.fromCharCode(65 + oi), // A, B, C, D …
      content: o.content,
      isCorrect: o.isCorrect,
    }));

    return {
      id: -(groupIndex * 1000 + qi + 1),
      content: q.content,
      position: positionOffset + qi + 1,
      explanation: q.explanation,
      tagIds: q.tagIds ?? [],
      options,
    };
  });

  return {
    id: -(groupIndex + 1),
    instruction: group.instruction ?? '',
    questionTypeCode: group.questionTypeCode,
    groupContent: group.groupContent,
    imageUrl: group.imageUrl,
    sharedOptions: group.sharedOptions,
    questions,
  };
}

export function mapStimulusRequestToDetail(stimulus: StimulusRequest, stimulusIndex: number): StimulusDetail {
  let positionOffset = 0;
  const questionGroups: QuestionGroupDetail[] = stimulus.questionGroups.map((g, gi) => {
    const detail = mapGroupRequestToDetail(g, gi, positionOffset);
    positionOffset += g.questions.length;
    return detail;
  });

  return {
    id: -(stimulusIndex + 1),
    title: stimulus.title,
    content: stimulus.content,
    mediaUrl: stimulus.mediaUrl ?? null,
    section: stimulus.section ?? 0,
    questionGroups,
  };
}
