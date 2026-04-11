'use client';

import { useState } from 'react';
import type { EvaluationEvent } from '@/types/speaking-exam.types';
import type { RecordedAnswer } from '@/hooks/use-session-recorder';
import { Volume2, Zap, AppWindow, FileText, Clock, CheckCircle, RotateCcw, Home, PlayCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import { useRouter } from 'next/navigation';

interface Props {
  evaluation: EvaluationEvent;
  recordings?: RecordedAnswer[];
  title?: string;
}

const CRITERIA_META = {
  pronunciation: {
    label: 'PRONUNCIATION',
    icon: Volume2,
    color: 'text-orange-500',
    barColor: 'bg-orange-500',
    desc: 'Đánh giá về độ chính xác của phát âm, trọng âm và ngữ điệu.',
  },
  fluency: {
    label: 'FLUENCY & COHERENCE',
    icon: Zap,
    color: 'text-blue-500',
    barColor: 'bg-blue-500',
    desc: 'Đánh giá về tốc độ nói, độ trôi chảy và khả năng kết nối ý tưởng.',
  },
  vocabulary: {
    label: 'LEXICAL RESOURCE',
    icon: AppWindow,
    color: 'text-green-500',
    barColor: 'bg-green-500',
    desc: 'Đánh giá về vốn từ vựng và khả năng sử dụng từ ngữ linh hoạt.',
  },
  grammar: {
    label: 'GRAMMATICAL RANGE',
    icon: FileText,
    color: 'text-purple-500',
    barColor: 'bg-purple-500',
    desc: 'Đánh giá về cấu trúc ngữ pháp và độ chính xác của câu.',
  },
} as const;

const CRITERION_KEY_MAP = {
  pronunciation: 'PR',
  fluency: 'FC',
  vocabulary: 'LR',
  grammar: 'GRA'
} as const;

export function ExamEvaluationResult({ evaluation, recordings, title }: Props) {
  const router = useRouter();
  const [selectedCriteria, setSelectedCriteria] = useState<keyof typeof CRITERIA_META | null>(null);
  const [showDetailedFeedback, setShowDetailedFeedback] = useState(false);

  // We do not have duration mapped in recordings yet, using a placeholder for now
  const timeString = recordings && recordings.length > 0 ? `Hoàn tất` : 'Không có dữ liệu';

  return (
    <div className="w-full max-w-[1000px] mx-auto font-sans relative">

      {/* ── CARD CONTAINER ── */}
      <div className="bg-white rounded-[24px] shadow-[0_10px_40px_-10px_rgba(0,0,0,0.08)] flex flex-col md:flex-row gap-6 p-6 md:p-8 mb-10 border border-gray-100">
        
        {/* LEFT PANEL */}
        <div className="w-full lg:w-[320px] shrink-0 flex flex-col gap-4">
          
          <div className="text-center pt-2 pb-4 border-b border-gray-100 mb-2">
            <h2 className="text-2xl font-bold text-[#2d3748] mb-1 tracking-tight">Kết quả bài thi Speaking</h2>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">IELTS PRACTICE TEST</p>
          </div>

          {/* Circular Band Score */}
          <div className="flex justify-center py-4">
            <div className="relative h-[180px] w-[180px] rounded-full bg-slate-50 flex items-center justify-center p-2 shadow-inner border border-gray-100">
              <div className="h-full w-full rounded-full bg-[#4f46e5] text-white flex flex-col items-center justify-center shadow-lg transform transition hover:scale-105 duration-300 relative overflow-hidden group">
                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                <span className="text-[10px] tracking-[0.15em] opacity-80 mb-1 font-bold z-10">BAND SCORE</span>
                <span className="text-[64px] leading-none font-bold z-10 tracking-tight">{Number(evaluation.final_band).toFixed(1)}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 mt-2">
            {/* Time info */}
            <div className="flex items-center gap-4 bg-[#f8fafc] px-4 py-3 rounded-[16px] border border-gray-100">
              <div className="h-10 w-10 flex items-center justify-center bg-yellow-50 text-yellow-500 rounded-full shrink-0 shadow-sm border border-yellow-100">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Thời gian</p>
                <p className="text-[13px] font-bold text-gray-800">{timeString}</p>
              </div>
            </div>

            {/* Status info */}
            <div className="flex items-center gap-4 bg-[#f8fafc] px-4 py-3 rounded-[16px] border border-gray-100">
              <div className="h-10 w-10 flex items-center justify-center bg-emerald-50 text-emerald-500 rounded-full shrink-0 shadow-sm border border-emerald-100">
                <CheckCircle className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Trạng thái</p>
                <p className="text-[13px] font-bold text-gray-800">Hoàn thành</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-2.5 mt-3">
            <Button 
              onClick={() => setShowDetailedFeedback(!showDetailedFeedback)}
              className="bg-[#0f172a] hover:bg-black text-white w-full rounded-2xl py-6 tracking-wide text-xs uppercase font-bold"
            >
              <FileText className="w-4 h-4 mr-2" />
              Xem Bài Làm & Đề Bài
            </Button>
            <div className="grid grid-cols-2 gap-2.5">
              <Button onClick={() => window.location.reload()} variant="outline" className="rounded-2xl py-6 border-gray-200 text-gray-500 bg-white hover:bg-gray-50 uppercase text-[11px] font-bold tracking-wider hover:text-gray-900 transition-colors">
                Làm lại
              </Button>
              <Button onClick={() => router.push('/practice?skill=speaking')} variant="outline" className="rounded-2xl py-6 border-gray-200 text-gray-500 bg-white hover:bg-gray-50 uppercase text-[11px] font-bold tracking-wider hover:text-gray-900 transition-colors">
                Trang chủ
              </Button>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL - 4 CRITERIA CARDS */}
        <div className="flex-1 lg:pl-4 pt-4 md:pt-0 border-t md:border-t-0 md:border-l border-gray-100">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full">
            {(Object.entries(CRITERIA_META) as [keyof typeof CRITERIA_META, typeof CRITERIA_META[keyof typeof CRITERIA_META]][]).map(([key, meta]) => {
              const score = evaluation[key];
              const Icon = meta.icon;
              const percentage = Math.min((score / 9) * 100, 100);

              return (
                <div key={key} className="bg-white rounded-[20px] border border-gray-100 shadow-sm p-5 flex flex-col hover:shadow-md transition duration-300">
                  <div className="flex justify-between items-center mb-3 gap-2">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <div className={`p-1.5 shrink-0 rounded-md bg-gray-50 border border-gray-100 ${meta.color}`}>
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-[10px] font-bold text-gray-700 tracking-wider uppercase truncate">
                        {meta.label}
                      </span>
                    </div>
                    <span className={`text-[22px] font-bold shrink-0 ${meta.color}`}>
                      {Number(score).toFixed(1)}
                    </span>
                  </div>
                  
                  {/* Visual Progress Bar */}
                  <div className="w-full bg-slate-100 rounded-full h-1.5 mb-4 relative overflow-hidden">
                    <div 
                      className={`absolute left-0 top-0 h-full ${meta.barColor} rounded-full transition-all duration-1000 ease-out`} 
                      style={{ width: `${percentage}%` }}
                    />
                  </div>

                  <p className="text-[13px] text-gray-500 leading-relaxed mb-4 flex-1">
                    {meta.desc}
                  </p>

                  <button 
                    onClick={() => setSelectedCriteria(key)}
                    className="text-left text-xs font-bold text-indigo-600 hover:text-indigo-800 transition tracking-wide"
                  >
                    Xem chi tiết
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── MODAL: DETAILED AI FEEDBACK & RECORDINGS ── */}
      <Dialog open={showDetailedFeedback} onOpenChange={setShowDetailedFeedback}>
        <DialogContent className="w-[90vw] max-w-6xl max-h-[90vh] overflow-y-auto bg-white p-6 md:p-8 rounded-3xl border-gray-100 outline-none">
          <DialogTitle className="text-2xl font-bold text-gray-800 mb-6 border-b border-gray-100 pb-4 tracking-tight">
            {title ? title : 'Chi tiết Đề bài & Bài làm'}
          </DialogTitle>
          
          <div className="space-y-6">
            {/* AI Summary */}
            {evaluation.feedback && (
              <div className="space-y-5">
                {evaluation.feedback.summary && (
                  <div className="bg-indigo-50/50 p-5 rounded-2xl border border-indigo-100/50 text-gray-700 leading-relaxed text-sm">
                    {evaluation.feedback.summary}
                  </div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {evaluation.feedback.strengths?.length > 0 && (
                     <div className="bg-emerald-50/50 p-5 rounded-2xl border border-emerald-100/50">
                       <h4 className="font-bold text-emerald-800 mb-3 flex items-center gap-2 text-[13px] uppercase tracking-wider">
                         <CheckCircle className="w-4 h-4 text-emerald-500" /> Điểm mạnh
                       </h4>
                       <ul className="space-y-2.5">
                         {evaluation.feedback.strengths.map((str, i) => (
                           <li key={i} className="text-[13px] text-gray-600 flex items-start gap-2.5 leading-relaxed">
                             <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                             {str}
                           </li>
                         ))}
                       </ul>
                     </div>
                  )}

                  {evaluation.feedback.areas_for_improvement?.length > 0 && (
                    <div className="bg-orange-50/50 p-5 rounded-2xl border border-orange-100/50">
                      <h4 className="font-bold text-orange-800 mb-3 flex items-center gap-2 text-[13px] uppercase tracking-wider">
                        <Zap className="w-4 h-4 text-orange-500" /> Cần cải thiện
                      </h4>
                      <ul className="space-y-2.5">
                        {evaluation.feedback.areas_for_improvement.map((str, i) => (
                          <li key={i} className="text-[13px] text-gray-600 flex items-start gap-2.5 leading-relaxed">
                            <div className="w-1.5 h-1.5 rounded-full bg-orange-400 mt-1.5 shrink-0" />
                            {str}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Recordings Array */}
            {recordings && recordings.length > 0 && (
              <div className="mt-8 pt-8 border-t border-gray-100 flex flex-col items-center">
                <h4 className="font-bold text-[#f97316] mb-6 flex items-center gap-2 tracking-tight text-lg">
                  <PlayCircle className="w-5 h-5 text-[#f97316]" />
                  Bản ghi âm & Transcript
                </h4>
                <div className="w-full space-y-6">
                  {recordings.map((rec, idx) => (
                     <div key={idx} className="bg-white border border-[#fed7aa] rounded-2xl p-6 shadow-sm hover:shadow-md transition duration-300 w-full">
                       <div className="flex flex-col gap-5">
                         {/* Question section */}
                         <div>
                           <div className="bg-[#ffedd5] text-[#ea580c] font-bold px-3 py-1.5 rounded-lg inline-block text-[11px] uppercase tracking-wider mb-3 border border-[#fed7aa]">
                             Part {rec.part} - Question {idx + 1}
                           </div>
                           <p className="text-[#2d3748] font-bold text-[15px] leading-relaxed mb-1">
                             <span className="text-[#f97316] mr-1">Q:</span>
                             {rec.questionText || 'Loading question...'}
                           </p>
                         </div>

                         {/* Audio & Script columns */}
                         <div className="flex flex-col lg:flex-row gap-5 items-start bg-white">
                           
                           {/* Audio column */}
                           <div className="w-full lg:w-1/3 shrink-0">
                             <div className="text-[12px] font-bold text-[#ea580c] uppercase tracking-widest mb-2 flex items-center gap-1.5">
                               <Volume2 className="w-3.5 h-3.5" />
                               Audio
                             </div>
                             {rec.audioUrl ? (
                               <audio 
                                 controls 
                                 src={rec.audioUrl}
                                 className="w-full h-10 outline-none accent-[#f97316]" 
                               />
                             ) : (
                                <p className="text-[13px] text-gray-400 italic bg-gray-50 border border-gray-100 rounded-lg p-3 text-center">
                                  Bạn không trả lời
                                </p>
                             )}
                           </div>

                           {/* Script column */}
                           <div className="w-full bg-[#fff7ed] rounded-xl p-5 border border-[#fed7aa] text-[14px] leading-relaxed text-gray-700 relative">
                              <div className="absolute -top-2.5 left-4 bg-white border border-[#fed7aa] px-2 py-0.5 text-[10px] font-bold text-[#ea580c] uppercase tracking-widest rounded shadow-sm">
                                Transcript
                              </div>
                              <span className="pt-1 block">
                                {rec.transcript || <span className="italic text-orange-300">Không nhận diện được giọng nói...</span>}
                              </span>
                           </div>

                         </div>
                       </div>
                     </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* ── MODAL: CRITERIA DETAILS ── */}
      <Dialog 
        open={selectedCriteria !== null} 
        onOpenChange={(open) => !open && setSelectedCriteria(null)}
      >
        {selectedCriteria && (
          <DialogContent className="sm:max-w-md rounded-[24px] p-0 overflow-hidden border border-gray-100 shadow-2xl bg-white focus:outline-none">
             <div className="px-8 pt-8 pb-6 flex items-end justify-between border-b border-gray-50">
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                    Tiêu chí chấm điểm
                  </p>
                  <DialogTitle className="text-2xl font-bold text-gray-900 leading-none m-0 p-0 outline-none focus:outline-none focus:ring-0 ring-0 tracking-tight">
                     {CRITERIA_META[selectedCriteria].label}
                  </DialogTitle>
                </div>
                <div className="text-right pb-1">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Band</p>
                  <p className={`text-[36px] font-extrabold leading-none ${CRITERIA_META[selectedCriteria].color}`}>
                    {Number(evaluation[selectedCriteria]).toFixed(1)}
                  </p>
                </div>
             </div>

             <div className="px-8 py-6 min-h-[140px] flex flex-col text-left text-[14px] leading-relaxed text-gray-600 border-b border-gray-50 overflow-y-auto max-h-[60vh]">
               <p className="mb-4">{CRITERIA_META[selectedCriteria].desc}</p>
               {evaluation.criteria && evaluation.criteria[CRITERION_KEY_MAP[selectedCriteria]] && (
                 <div className="space-y-4">
                   {evaluation.criteria[CRITERION_KEY_MAP[selectedCriteria]].strengths.length > 0 && (
                     <div className="bg-green-50/50 p-4 rounded-xl border border-green-100">
                       <strong className="text-green-700 block mb-2 text-xs uppercase tracking-wider">Điểm mạnh</strong>
                       <ul className="list-disc pl-5 space-y-1.5 text-green-900/80">
                         {evaluation.criteria[CRITERION_KEY_MAP[selectedCriteria]].strengths.map((s, i) => (
                           <li key={i}>{s}</li>
                         ))}
                       </ul>
                     </div>
                   )}
                   {evaluation.criteria[CRITERION_KEY_MAP[selectedCriteria]].weaknesses.length > 0 && (
                     <div className="bg-red-50/50 p-4 rounded-xl border border-red-100">
                       <strong className="text-red-600 block mb-2 text-xs uppercase tracking-wider">Cần cải thiện</strong>
                       <ul className="list-disc pl-5 space-y-1.5 text-red-900/80">
                         {evaluation.criteria[CRITERION_KEY_MAP[selectedCriteria]].weaknesses.map((s, i) => (
                           <li key={i}>{s}</li>
                         ))}
                       </ul>
                     </div>
                   )}
                 </div>
               )}
             </div>

             <div className="px-8 pb-8 pt-6">
                <Button 
                  onClick={() => setSelectedCriteria(null)} 
                  className="w-full bg-[#0f172a] hover:bg-black text-white py-6 rounded-2xl text-[11px] uppercase tracking-widest font-bold shadow-lg shadow-black/5"
                >
                  Đóng Nhận Xét
                </Button>
             </div>
          </DialogContent>
        )}
      </Dialog>
      
    </div>
  );
}
