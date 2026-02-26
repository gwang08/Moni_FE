'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AdminHeader } from '@/components/admin/admin-header';
import { TestImportStep1, type BasicInfo } from '@/components/admin/test-import-step1-basic-info';
import { TestImportStep2 } from '@/components/admin/test-import-step2-stimuli';
import { TestImportStep3 } from '@/components/admin/test-import-step3-questions';
import { importTest } from '@/lib/admin-api';
import type { StimulusRequest } from '@/types/admin.types';

const STEPS = ['Thông tin cơ bản', 'Stimulus', 'Câu hỏi', 'Xem lại & Nộp'];

export default function TestImportPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [basicInfo, setBasicInfo] = useState<BasicInfo>({ title: '', description: '', testType: '', skill: '' });
  const [stimuli, setStimuli] = useState<StimulusRequest[]>([]);

  const handleSubmit = async () => {
    setSubmitting(true);
    setError('');
    try {
      await importTest({
        title: basicInfo.title,
        description: basicInfo.description,
        testType: basicInfo.testType,
        skill: basicInfo.skill,
        stimuli: stimuli.map(s => ({ ...s, mediaUrl: s.mediaUrl || undefined })),
      });
      router.push('/admin/tests');
    } catch {
      setError('Tạo bài thi thất bại. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <AdminHeader title="Tạo bài thi mới" />
      <div className="p-6 max-w-3xl">
        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-8">
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

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          {step === 1 && <TestImportStep1 data={basicInfo} onChange={setBasicInfo} onNext={() => setStep(2)} />}
          {step === 2 && <TestImportStep2 stimuli={stimuli} onChange={setStimuli} onNext={() => setStep(3)} onBack={() => setStep(1)} />}
          {step === 3 && <TestImportStep3 stimuli={stimuli} onChange={setStimuli} onNext={() => setStep(4)} onBack={() => setStep(2)} />}

          {step === 4 && (
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <p className="text-sm"><span className="font-medium">Tiêu đề:</span> {basicInfo.title}</p>
                <p className="text-sm"><span className="font-medium">Mô tả:</span> {basicInfo.description}</p>
                <p className="text-sm"><span className="font-medium">Loại:</span> {basicInfo.testType}</p>
                <p className="text-sm"><span className="font-medium">Kỹ năng:</span> {basicInfo.skill}</p>
                <p className="text-sm"><span className="font-medium">Số stimulus:</span> {stimuli.length}</p>
                <p className="text-sm"><span className="font-medium">Tổng câu hỏi:</span> {stimuli.reduce((sum, s) => sum + s.questions.length, 0)}</p>
              </div>
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(3)}>Quay lại</Button>
                <Button onClick={handleSubmit} disabled={submitting}>
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Tạo bài thi'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
