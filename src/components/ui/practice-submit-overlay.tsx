'use client';

import { Check, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';

interface Props {
  isSubmitting: boolean;
  submitted: boolean;
}

/**
 * An elegant, modern overlay for practice mode submission.
 * Provides visual feedback during the API call and a success state before transition.
 */
export function PracticeSubmitOverlay({ isSubmitting, submitted }: Props) {
  const [show, setShow] = useState(false);
  const [stage, setStage] = useState<'idle' | 'loading' | 'success'>('idle');

  useEffect(() => {
    if (isSubmitting) {
      setShow(true);
      setStage('loading');
    } else if (submitted) {
      setStage('success');
      // Keep visible for a bit to show success animation
      const timer = setTimeout(() => {
        // We usually redirect or change view here, so we don't necessarily need to hide
      }, 2000);
      return () => clearTimeout(timer);
    } else {
      setShow(false);
      setStage('idle');
    }
  }, [isSubmitting, submitted]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-white/60 backdrop-blur-md animate-in fade-in duration-500">
      <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl shadow-gray-200/50 border border-gray-100 flex flex-col items-center gap-6 animate-in zoom-in-95 duration-300">
        
        {stage === 'loading' ? (
          <div className="relative flex items-center justify-center">
            <div className="h-20 w-20 rounded-full border-4 border-gray-50 border-t-emerald-500 animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
               <div className="h-12 w-12 rounded-full bg-emerald-50/50 flex items-center justify-center">
                  <Loader2 className="h-6 w-6 text-emerald-600 animate-pulse" />
               </div>
            </div>
          </div>
        ) : (
          <div className="h-20 w-20 rounded-full bg-emerald-500 flex items-center justify-center animate-in zoom-in duration-500 ring-8 ring-emerald-50">
            <Check className="h-10 w-10 text-white stroke-[4px] animate-in slide-in-from-bottom-2 duration-300" />
          </div>
        )}

        <div className="text-center space-y-2">
          <h3 className="text-xl font-black text-gray-900 uppercase tracking-tighter italic">
            {stage === 'loading' ? 'Đang chấm điểm...' : 'Hoàn tất!'}
          </h3>
          <p className="text-sm text-gray-400 font-bold uppercase tracking-widest leading-none">
            {stage === 'loading' ? 'Hệ thống AI đang xử lý bài làm' : 'Đang chuẩn bị kết quả cho bạn'}
          </p>
        </div>

        {/* Minimal progress indicator dots */}
        <div className="flex gap-1.5 mt-2">
           {[0, 1, 2].map(i => (
             <div 
               key={i} 
               className={`h-1.5 w-1.5 rounded-full transition-all duration-500 ${
                 stage === 'success' ? 'bg-emerald-500 scale-125' : 'bg-gray-200 animate-pulse'
               }`}
               style={{ animationDelay: `${i * 150}ms` }}
             />
           ))}
        </div>
      </div>
    </div>
  );
}
