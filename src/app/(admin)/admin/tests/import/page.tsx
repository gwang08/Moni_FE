'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { AdminHeader } from '@/components/admin/admin-header';
import { TestImportStep1, type BasicInfo } from '@/components/admin/test-import-step1-basic-info';
import { TestImportStep2 } from '@/components/admin/test-import-step2-stimuli';
import { TestImportStep2Listening } from '@/components/admin/test-import-step2-listening';
import { TestImportStep2Writing } from '@/components/admin/test-import-step2-writing';
import { TestImportStep2Speaking } from '@/components/admin/test-import-step2-speaking';
import { TestImportStep3 } from '@/components/admin/test-import-step3-questions';
import { TestImportStep4 } from '@/components/admin/test-import-step4-review';
import { importTest, transcribeStimulus, uploadMedia } from '@/lib/admin-api';
import { getTestDetail } from '@/lib/tests-api';
import { toast } from 'sonner';
import type { StimulusRequest } from '@/types/admin.types';

const STORAGE_KEY = 'test-import-draft';

function getStepLabels(skill: string) {
  if (skill === 'WRITING' || skill === 'SPEAKING')
    return ['Thông tin cơ bản', 'Nhập nội dung', 'Xem lại & Nộp'];
  return ['Thông tin cơ bản', 'Nhập đề thi', 'Câu hỏi', 'Xem lại & Nộp'];
}

function StepIndicator({ step, skill }: { step: number; skill: string }) {
  const steps = getStepLabels(skill);
  return (
    <div className="flex items-center gap-2 mb-6">
      {steps.map((label, i) => {
        const num = i + 1;
        const active = num === step;
        const done = num < step;
        return (
          <div key={i} className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold ${
              done ? 'bg-green-500 text-white' : active ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
            }`}>{num}</div>
            <span className={`text-xs ${active ? 'text-blue-600 font-medium' : 'text-gray-500'}`}>{label}</span>
            {i < steps.length - 1 && <div className="w-8 h-px bg-gray-300" />}
          </div>
        );
      })}
    </div>
  );
}

function loadDraft(): { basicInfo: BasicInfo; stimuli: StimulusRequest[] } | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export default function TestImportPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialStep = Math.min(4, Math.max(1, Number(searchParams.get('step')) || 1));

  const [step, setStepRaw] = useState(initialStep);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const draft = loadDraft();
  const [basicInfo, setBasicInfo] = useState<BasicInfo>(draft?.basicInfo ?? { title: '', description: '', skill: '', thumbnailUrl: '', testMode: '', section: null, testType: '', duration: null });
  const [stimuli, setStimuli] = useState<StimulusRequest[]>(draft?.stimuli ?? []);
  const thumbnailFileRef = useRef<File | null>(null);

  const skill = basicInfo.skill;
  const skipQuestionStep = skill === 'WRITING' || skill === 'SPEAKING';
  const totalSteps = skipQuestionStep ? 3 : 4;
  const reviewStep = totalSteps;

  const setStep = useCallback((s: number) => {
    setStepRaw(s);
    const url = new URL(window.location.href);
    url.searchParams.set('step', String(s));
    window.history.replaceState(null, '', url.toString());
  }, []);

  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ basicInfo, stimuli }));
  }, [basicInfo, stimuli]);

  const handleSubmit = async () => {
    setSubmitting(true);
    setError('');
    try {
      // Upload thumbnail if user selected a file (deferred upload)
      let thumbnailUrl = basicInfo.thumbnailUrl || undefined;
      if (thumbnailFileRef.current) {
        thumbnailUrl = await uploadMedia(thumbnailFileRef.current);
        thumbnailFileRef.current = null;
      }

      const testId = await importTest({
        title: basicInfo.title,
        description: basicInfo.description || undefined,
        skill: basicInfo.skill,
        testMode: basicInfo.testMode || undefined,
        section: basicInfo.section ?? undefined,
        thumbnailUrl,
        testType: basicInfo.testType || undefined,
        duration: basicInfo.duration ?? undefined,
        stimuli: stimuli.map((s, i) => ({
          ...s,
          title: s.title || `Passage ${i + 1}`,
          section: s.section ?? i + 1,
          questionGroups: s.questionGroups.map(g => ({
            ...g,
            // Speaking already has position/questionCategory set by step2 — don't override
            questions: skill === 'SPEAKING'
              ? g.questions
              : g.questions.map((q, qi) => ({ ...q, position: qi + 1 })),
          })),
        })),
      });
      sessionStorage.removeItem(STORAGE_KEY);

      // Auto-trigger transcript generation for LISTENING tests
      if (skill === 'LISTENING') {
        toast.success('Tạo bài thi thành công! Đang tạo transcript tự động...');
        // Fire-and-forget: fetch test detail → transcribe each stimulus with audio
        getTestDetail(String(testId)).then(detail => {
          const audioStimuli = detail.stimuli.filter(s => s.mediaUrl);
          audioStimuli.forEach(s => {
            transcribeStimulus(s.id).then(() => {
              toast.success(`Transcript đã tạo xong cho "${s.title || 'Section ' + s.section}"`);
            }).catch(() => {
              toast.error(`Tạo transcript thất bại cho "${s.title || 'Section ' + s.section}"`);
            });
          });
        }).catch(() => {
          toast.error('Không thể tải chi tiết bài thi để tạo transcript');
        });
      }

      router.push('/admin/tests');
    } catch {
      setError('Tạo bài thi thất bại. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  // Step 2 → Step 3 routing
  const handleStep2Next = () => {
    if (skipQuestionStep) {
      setStep(3); // goes to review (step 3 = review for 3-step flow)
    } else {
      setStep(3); // goes to questions
    }
  };

  // Step 3 (questions) → Step 4 (review) — only for Reading/Listening
  const handleStep3Next = () => setStep(4);

  // Review back button
  const handleReviewBack = () => {
    if (skipQuestionStep) {
      setStep(2);
    } else {
      setStep(3);
    }
  };

  // Step 3 full-width layout (only for Reading/Listening)
  if (!skipQuestionStep && step === 3) {
    return (
      <div>
        <AdminHeader title="Tạo bài thi mới" />
        <div className="px-6 pt-6">
          <StepIndicator step={step} skill={skill} />
        </div>
        <div className="px-4">
          <TestImportStep3 stimuli={stimuli} onChange={setStimuli} onNext={handleStep3Next} onBack={() => setStep(2)} />
        </div>
      </div>
    );
  }

  // Determine if current step is the review step
  const isReviewStep = step === reviewStep;

  return (
    <div>
      <AdminHeader title="Tạo bài thi mới" />
      <div className="p-6 max-w-3xl">
        <StepIndicator step={step} skill={skill} />

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          {step === 1 && <TestImportStep1 data={basicInfo} onChange={setBasicInfo} onNext={() => setStep(2)}
            onThumbnailFileSelected={(file) => { thumbnailFileRef.current = file; }} />}

          {step === 2 && skill === 'LISTENING' && (
            <TestImportStep2Listening stimuli={stimuli} onChange={setStimuli} onNext={handleStep2Next} onBack={() => setStep(1)} />
          )}
          {step === 2 && skill === 'WRITING' && (
            <TestImportStep2Writing stimuli={stimuli} onChange={setStimuli} onNext={handleStep2Next} onBack={() => setStep(1)} section={basicInfo.section} />
          )}
          {step === 2 && skill === 'SPEAKING' && (
            <TestImportStep2Speaking stimuli={stimuli} onChange={setStimuli} onNext={handleStep2Next} onBack={() => setStep(1)} />
          )}
          {step === 2 && (skill === 'READING' || !skill) && (
            <TestImportStep2 stimuli={stimuli} onChange={setStimuli} onNext={handleStep2Next} onBack={() => setStep(1)} />
          )}

          {isReviewStep && (
            <TestImportStep4
              basicInfo={basicInfo}
              stimuli={stimuli}
              submitting={submitting}
              error={error}
              onSubmit={handleSubmit}
              onBack={handleReviewBack}
            />
          )}
        </div>
      </div>
    </div>
  );
}
