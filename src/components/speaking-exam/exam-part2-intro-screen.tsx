import { useState } from 'react';
import { Play, Mic, PauseCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  onStartNow: () => void;
}

export function ExamPart2IntroScreen({ onStartNow }: Props) {
  return (
    <div className="flex gap-0 overflow-hidden rounded-lg border border-gray-200 bg-white">
      {/* Main content */}
      <div className="flex flex-1 flex-col bg-white">
        <div className="py-6 text-center">
          <h2 className="text-[20px] font-bold text-[#334155]">Part 2</h2>
        </div>

        <div className="flex flex-1 flex-col items-center justify-center p-8 text-center mb-10">
          <ul className="space-y-3 text-[#334155] max-w-lg text-left inline-block">
            <li className="leading-relaxed text-[15px]">Part 2 will take about 3 to 4 minutes.</li>
            <li className="leading-relaxed text-[15px]">
              In this part, you will be given a topic card and you will have 1-2 minutes to talk about it.
            </li>
            <li className="leading-relaxed text-[15px]">
              Before you talk, you will have exactly 1 minute to prepare, and you can make some notes on the paper provided if you wish.
            </li>
          </ul>
        </div>

        <div className="flex justify-center border-t border-gray-100 p-5 bg-white shrink-0 mt-auto">
          <Button
            onClick={onStartNow}
            className="gap-2 rounded-full bg-[#ff7b42] px-8 py-5 text-[15px] text-white hover:bg-[#ea580c] shadow-sm font-medium"
          >
            <Play className="h-4 w-4 fill-current" />
            Start now
          </Button>
        </div>
      </div>
    </div>
  );
}

/**
 * Part 2 Cue Card screen — shows topic card + note sidebar + timers
 * Handles both the Prep phase and the Speaking phase so notes are not lost.
 */
interface CueCardWithNoteProps {
  topic: string;
  isPrepPhase: boolean;
  prepTimer: number;
  onSkipPrep: () => void;

  speakTimer?: number;
  isListening?: boolean;
  onStopSpeaking?: () => void;
}

export function ExamPart2CueCardWithNote({ 
  topic, 
  isPrepPhase,
  prepTimer, 
  onSkipPrep,
  speakTimer = 0,
  isListening,
  onStopSpeaking
}: CueCardWithNoteProps) {
  const [note, setNote] = useState('');

  // Parse cue card topic — if it contains bullet points / "You should say:"
  const lines = (topic || '').split('\n').filter(Boolean);
  const title = lines[0] || (topic || 'Part 2 Topic');
  const hasSubPoints = lines.length > 1;

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  return (
    <div className="flex gap-0 overflow-hidden rounded-lg border border-gray-200 bg-white min-h-[60vh]">
      {/* Main content */}
      <div className="flex flex-1 flex-col bg-white">
        <div className="py-6 text-center shrink-0">
          <h2 className="text-[20px] font-bold text-[#334155]">Part 2</h2>
        </div>

        <div className="flex flex-1 flex-col p-8 overflow-y-auto">
          {/* Cue card content */}
          <div className="mb-8 max-w-xl mx-auto w-full">
            <h3 className="mb-4 text-xl font-semibold text-[#f97316] text-center">{title}</h3>
            {hasSubPoints && (
              <div className="pl-4 md:pl-10">
                <p className="mb-3 text-[15px] font-medium text-gray-600">You should say:</p>
                <ul className="space-y-3">
                  {lines.slice(1).map((line, i) => (
                    <li key={i} className="flex items-start gap-3 text-[#2d3748]">
                      <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-gray-400" />
                      <span className="text-[15px]">{line.replace(/^[-•*]\s*/, '')}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {!hasSubPoints && (
              <p className="text-[#2d3748] text-[15px] leading-relaxed whitespace-pre-line text-center">{topic}</p>
            )}
          </div>
        </div>

        {/* Timer footer */}
        {isPrepPhase ? (
          <div className="border-t border-gray-100 py-5 text-center shrink-0 bg-gray-50/50">
            <p className="mb-1 text-sm text-gray-500 font-medium">Thinking time</p>
            <span className="text-xl font-bold tabular-nums text-green-600">
              {formatTime(prepTimer)}
            </span>
            <div className="mt-4 flex justify-center gap-3">
              <div className="flex items-center gap-2 rounded-full bg-[#f97316] px-6 py-2.5 text-sm font-medium text-white shadow-sm">
                <Mic className="h-4 w-4" />
                Recording will start after thinking time
              </div>
            </div>
            <button
              onClick={onSkipPrep}
              className="mt-4 text-[13px] font-medium text-blue-600 hover:text-blue-700 hover:underline flex items-center justify-center w-full"
            >
              <PauseCircle className="mr-1.5 h-3.5 w-3.5" />
              I&apos;m ready, skip thinking time
            </button>
          </div>
        ) : (
          <div className="border-t border-gray-100 py-5 text-center shrink-0 bg-white">
            <div className="flex justify-center mb-4">
              <div
                className={`flex items-center gap-2 rounded-full border px-6 py-2.5 ${
                  speakTimer <= 10
                    ? 'border-red-300 bg-red-50 text-red-600'
                    : 'border-red-200 bg-red-50/50 text-red-500'
                }`}
              >
                <span className="h-2.5 w-2.5 rounded bg-red-500 shadow-sm" />
                <span className="text-sm font-medium">Time limit {formatTime(speakTimer)}</span>
              </div>
            </div>
            
            {isListening && (
              <div className="mb-3 flex justify-center items-center gap-2">
                <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
                <span className="text-sm text-gray-500 font-medium">Listening...</span>
              </div>
            )}

            <button
              onClick={onStopSpeaking}
              className="text-[13px] font-medium text-blue-600 hover:text-blue-700 hover:underline flex items-center justify-center w-full"
            >
              <CheckCircle className="mr-1.5 h-3.5 w-3.5" />
              Finish my answer early
            </button>
          </div>
        )}
      </div>

      {/* Note sidebar */}
      <div className="w-64 flex-shrink-0 border-l border-yellow-300 flex flex-col bg-[#fffde7]">
        <div className="bg-[#fbbf24] px-4 py-3 text-center text-[15px] font-bold text-[#2d3748] shadow-sm shrink-0">
          Note
        </div>
        <div className="flex-1 p-4">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Type your notes here..."
            className="h-full w-full resize-none bg-transparent text-[15px] leading-relaxed text-gray-800 outline-none placeholder:text-gray-400"
          />
        </div>
      </div>
    </div>
  );
}
