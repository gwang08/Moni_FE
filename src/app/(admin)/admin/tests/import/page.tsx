'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AdminHeader } from '@/components/admin/admin-header';
import { TestImportStep1, type BasicInfo } from '@/components/admin/test-import-step1-basic-info';
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
  if (skill === 'WRITING' || skill === 'SPEAKING') {
    return ['Thông tin cơ bản', 'Nhập nội dung', 'Xem lại & Nộp'];
  }
  return ['Thông tin cơ bản', 'Nhập đề thi & câu hỏi', 'Xem lại & Nộp'];
}

function StepIndicator({ step, skill }: { step: number; skill: string }) {
  const steps = getStepLabels(skill);
  return (
    <div className="mb-6 flex items-center gap-2">
      {steps.map((label, i) => {
        const num = i + 1;
        const active = num === step;
        const done = num < step;
        return (
          <div key={i} className="flex items-center gap-2">
            <div
              className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${
                done ? 'bg-green-500 text-white' : active ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
              }`}
            >
              {num}
            </div>
            <span className={`text-xs ${active ? 'font-medium text-blue-600' : 'text-gray-500'}`}>{label}</span>
            {i < steps.length - 1 && <div className="h-px w-8 bg-gray-300" />}
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
  } catch {
    return null;
  }
}

export default function TestImportPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialStep = Math.min(3, Math.max(1, Number(searchParams.get('step')) || 1));

  const [step, setStepRaw] = useState(initialStep);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const draft = loadDraft();
  const [basicInfo, setBasicInfo] = useState<BasicInfo>(draft?.basicInfo ?? { title: '', skill: '', thumbnailUrl: '', section: null, testType: '' });
  const [stimuli, setStimuli] = useState<StimulusRequest[]>(draft?.stimuli ?? []);
  const thumbnailFileRef = useRef<File | null>(null);
  const [listeningAudioDuration, setListeningAudioDuration] = useState<number>(0); // in seconds
  const [speakingDuration, setSpeakingDuration] = useState<number>(0); // in seconds

  const skill = basicInfo.skill;
  const isReadingOrListening = skill === 'READING' || skill === 'LISTENING' || !skill;
  const reviewStep = 3;

  // Calculate speaking duration based on part and questions
  const calculateSpeakingDuration = useCallback((part: number, stimuli: StimulusRequest[]): number => {
    if (stimuli.length === 0) return 0;
    const stimulus = stimuli[0];
    const questions = stimulus.questionGroups[0]?.questions || [];
    
    if (part === 2) {
      // Part 2: 120s (cue card)
      return 120;
    } else if (part === 1) {
      // Part 1: 30s per question
      return questions.length * 30;
    } else if (part === 3) {
      // Part 3: 60s per question
      return questions.length * 60;
    }
    return 0;
  }, []);

  const setStep = useCallback((s: number) => {
    setStepRaw(s);
    const url = new URL(window.location.href);
    url.searchParams.set('step', String(s));
    window.history.replaceState(null, '', url.toString());
  }, []);

  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ basicInfo, stimuli }));
  }, [basicInfo, stimuli]);

  useEffect(() => {
    if (step > 1 && !skill) {
      setStep(1);
    }
  }, [step, skill, setStep]);

  // Calculate speaking duration when stimuli change
  useEffect(() => {
    if (skill === 'SPEAKING' && basicInfo.section) {
      const duration = calculateSpeakingDuration(basicInfo.section, stimuli);
      setSpeakingDuration(duration);
    }
  }, [skill, basicInfo.section, stimuli, calculateSpeakingDuration]);

  const handleSubmit = async () => {
    setSubmitting(true);
    setError('');
    try {
      let thumbnailUrl = basicInfo.thumbnailUrl || undefined;
      if (thumbnailFileRef.current) {
        thumbnailUrl = await uploadMedia(thumbnailFileRef.current);
        thumbnailFileRef.current = null;
      }

      const testId = await importTest({
        title: basicInfo.title,
        skill: basicInfo.skill,
        testType: basicInfo.testType,
        testMode: 'PRACTICE',
        section: basicInfo.section ?? undefined,
        thumbnailUrl,
        duration: basicInfo.skill === 'WRITING' 
          ? (basicInfo.section === 1 ? 20 * 60 : 40 * 60) 
          : basicInfo.skill === 'LISTENING' 
            ? Math.ceil(listeningAudioDuration) + 60 
            : basicInfo.skill === 'SPEAKING'
              ? speakingDuration
              : 60 * 60,
        stimuli: stimuli.map((s, i) => ({
          ...s,
          title: s.title || `Passage ${i + 1}`,
          section: s.section ?? i + 1,
          questionGroups: s.questionGroups.map((g) => ({
            ...g,
            questions:
              skill === 'SPEAKING'
                ? g.questions
                : g.questions.map((q, qi) => ({ ...q, position: qi + 1 })),
          })),
        })),
      });
      sessionStorage.removeItem(STORAGE_KEY);

      if (skill === 'LISTENING') {
        toast.success('Tạo bài thi thành công! Đang tạo transcript tự động...');
        getTestDetail(String(testId))
          .then((detail) => {
            const audioStimuli = detail.stimuli.filter((s) => s.mediaUrl);
            audioStimuli.forEach((s) => {
              transcribeStimulus(s.id)
                .then(() => {
                  toast.success(`Transcript đã tạo xong cho "${s.title || 'Section ' + s.section}"`);
                })
                .catch(() => {
                  toast.error(`Tạo transcript thất bại cho "${s.title || 'Section ' + s.section}"`);
                });
            });
          })
          .catch(() => {
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

  const handleStep2Next = () => setStep(3);
  const handleReviewBack = () => setStep(2);

  if (isReadingOrListening && step === 2) {
    return (
      <div className="flex h-screen flex-col overflow-hidden">
        <AdminHeader title="Tạo bài thi mới" />
        <div className="shrink-0 px-6 pt-6">
          <StepIndicator step={step} skill={skill} />
        </div>
        <div className="min-h-0 flex-1 overflow-hidden px-4">
          <TestImportStep3 
            skill={skill} 
            stimuli={stimuli} 
            onChange={setStimuli} 
            onNext={handleStep2Next} 
            onBack={() => setStep(1)} 
            onAudioDurationChange={setListeningAudioDuration}
          />
        </div>
      </div>
    );
  }

  const isReviewStep = step === reviewStep;

  return (
    <div>
      <AdminHeader title="Tạo bài thi mới" />
      <div className="p-6 max-w-3xl">
        <StepIndicator step={step} skill={skill} />

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          {step === 1 && (
            <TestImportStep1
              data={basicInfo}
              onChange={setBasicInfo}
              onNext={() => setStep(2)}
              onThumbnailFileSelected={(file) => {
                thumbnailFileRef.current = file;
              }}
            />
          )}

          {step === 2 && skill === 'WRITING' && (
            <TestImportStep2Writing stimuli={stimuli} onChange={setStimuli} onNext={handleStep2Next} onBack={() => setStep(1)} section={basicInfo.section} />
          )}
          {step === 2 && skill === 'SPEAKING' && (
            <TestImportStep2Speaking
              stimuli={stimuli}
              onChange={setStimuli}
              onNext={handleStep2Next}
              onBack={() => setStep(1)}
              part={basicInfo.section ?? 1}
            />
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
