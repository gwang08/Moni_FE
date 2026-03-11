'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { AdminHeader } from '@/components/admin/admin-header';
import { TestImportStep1, type BasicInfo } from '@/components/admin/test-import-step1-basic-info';
import { TestImportStep2 } from '@/components/admin/test-import-step2-stimuli';
import { TestImportStep3 } from '@/components/admin/test-import-step3-questions';
import { TestImportStep4 } from '@/components/admin/test-import-step4-review';
import { importTest } from '@/lib/admin-api';
import type { StimulusRequest } from '@/types/admin.types';

const STEPS = ['Thông tin cơ bản', 'Nhập đề thi', 'Câu hỏi', 'Xem lại & Nộp'];

function StepIndicator({ step }: { step: number }) {
  return (
    <div className="flex items-center gap-2 mb-6">
      {STEPS.map((label, i) => {
        const num = i + 1;
        const active = num === step;
        const done = num < step;
        return (
          <div key={i} className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold ${
              done ? 'bg-green-500 text-white' : active ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
            }`}>{num}</div>
            <span className={`text-xs ${active ? 'text-blue-600 font-medium' : 'text-gray-500'}`}>{label}</span>
            {i < STEPS.length - 1 && <div className="w-8 h-px bg-gray-300" />}
          </div>
        );
      })}
    </div>
  );
}

export default function TestImportPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [basicInfo, setBasicInfo] = useState<BasicInfo>({ title: '', description: '', skill: '', thumbnailUrl: '', testMode: '', section: null });
  const [stimuli, setStimuli] = useState<StimulusRequest[]>([]);

  const handleSubmit = async () => {
    setSubmitting(true);
    setError('');
    try {
      await importTest({
        title: basicInfo.title,
        description: basicInfo.description || undefined,
        skill: basicInfo.skill,
        testMode: basicInfo.testMode || undefined,
        section: basicInfo.section ?? undefined,
        thumbnailUrl: basicInfo.thumbnailUrl || undefined,
        stimuli: stimuli.map((s, i) => ({
          ...s,
          title: s.title || `Passage ${i + 1}`,
          section: s.section ?? i + 1,
          questionGroups: s.questionGroups.map(g => ({
            ...g,
            questions: g.questions.map((q, qi) => ({ ...q, position: qi + 1 })),
          })),
        })),
      });
      router.push('/admin/tests');
    } catch {
      setError('Tạo bài thi thất bại. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  // Step 3: full-width layout (passage outside card)
  if (step === 3) {
    return (
      <div>
        <AdminHeader title="Tạo bài thi mới" />
        <div className="px-6 pt-6">
          <StepIndicator step={step} />
        </div>
        <div className="px-4">
          <TestImportStep3 stimuli={stimuli} onChange={setStimuli} onNext={() => setStep(4)} onBack={() => setStep(2)} />
        </div>
      </div>
    );
  }

  return (
    <div>
      <AdminHeader title="Tạo bài thi mới" />
      <div className="p-6 max-w-3xl">
        <StepIndicator step={step} />

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          {step === 1 && <TestImportStep1 data={basicInfo} onChange={setBasicInfo} onNext={() => setStep(2)} />}
          {step === 2 && <TestImportStep2 stimuli={stimuli} onChange={setStimuli} onNext={() => setStep(3)} onBack={() => setStep(1)} />}

          {step === 4 && (
            <TestImportStep4
              basicInfo={basicInfo}
              stimuli={stimuli}
              submitting={submitting}
              error={error}
              onSubmit={handleSubmit}
              onBack={() => setStep(3)}
            />
          )}
        </div>
      </div>
    </div>
  );
}
