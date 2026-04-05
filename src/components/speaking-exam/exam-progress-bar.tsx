'use client';

interface Props {
  currentPart: number; // 0 = Intro, 1 = Part 1, 2 = Part 2, 3 = Part 3
  currentQuestionIndex: number; // 0-based index within the current part
  partConfig?: Record<number, number>; // Mapping of Part number (1,2,3) to total questions
}

export function ExamProgressBar({ currentPart, currentQuestionIndex, partConfig }: Props) {
  const finalConfig = {
    part1: partConfig?.[1] || 12,
    part2: partConfig?.[2] || 1,
    part3: partConfig?.[3] || 6,
  };

  const calculateProgress = (part: number, qIdx: number): number => {
    const total = finalConfig.part1 + finalConfig.part2 + finalConfig.part3;
    let completed = 0;
    if (part === 0) { completed = 0; }
    else if (part === 1) { completed = qIdx; }
    else if (part === 2) { completed = finalConfig.part1 + qIdx; }
    else if (part === 3) { completed = finalConfig.part1 + finalConfig.part2 + qIdx; }
    else { completed = total; }
    return (completed / total) * 100;
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 border-t border-gray-200 bg-[#faf6f1] px-4 py-3">
      <div className="mx-auto max-w-6xl">
        <div className="flex items-start gap-2">
          {/* Intro */}
          <div
            className={`rounded-lg px-3 py-2 shrink-0 ${
              currentPart > 0
                ? 'bg-[#16a34a]'
                : currentPart === 0
                ? 'border-2 border-[#16a34a] bg-white'
                : 'border border-gray-200 bg-white'
            }`}
          >
            <div className="flex items-center gap-2">
              <span
                className={`text-sm font-medium ${
                  currentPart > 0 ? 'text-white' : currentPart === 0 ? 'text-[#16a34a]' : 'text-gray-400'
                }`}
              >
                Intro
              </span>
              {currentPart > 0 ? (
                <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.815a.75.75 0 011.05-.145z" clipRule="evenodd" />
                </svg>
              ) : currentPart === 0 ? (
                <svg
                  className="h-5 w-5 text-[#16a34a]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              ) : null}
            </div>
          </div>

          {/* Part 1 */}
          <div
            className={`rounded-lg px-3 py-2 ${
              currentPart > 1 ? 'shrink-0 bg-[#16a34a]' : currentPart === 1 ? 'flex-1 border-2 border-[#16a34a] bg-white overflow-x-auto' : 'flex-1 border border-gray-200 bg-white overflow-x-auto'
            }`}
          >
            <div className="flex items-center gap-2 min-w-max">
              <span
                className={`text-sm font-medium ${
                  currentPart > 1 ? 'text-white' : currentPart === 1 ? 'text-[#16a34a]' : 'text-gray-400'
                }`}
              >
                Part 1
              </span>
              {currentPart > 1 ? (
                <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.815a.75.75 0 011.05-.145z" clipRule="evenodd" />
                </svg>
              ) : (
                <div className="flex gap-1.5 flex-wrap">
                  {Array.from({ length: finalConfig.part1 }).map((_, idx) => {
                    const isActive = currentPart === 1 && idx === currentQuestionIndex;
                    const isCompleted = currentPart > 1 || (currentPart === 1 && idx < currentQuestionIndex);

                    return (
                      <div
                        key={idx}
                        className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium shrink-0 ${
                          isActive
                            ? 'border-2 border-[#16a34a] bg-white text-[#16a34a]'
                            : isCompleted
                            ? 'border border-[#16a34a] bg-[#16a34a] text-white'
                            : 'border border-gray-200 bg-white text-gray-300'
                        }`}
                      >
                        {idx + 1}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Part 2 */}
          <div
            className={`rounded-lg px-3 py-2 ${
              currentPart > 2 ? 'shrink-0 bg-[#16a34a]' : currentPart === 2 ? 'border-2 border-[#16a34a] bg-white' : 'border border-gray-200 bg-white'
            }`}
          >
            <div className="flex items-center gap-2">
              <span
                className={`text-sm font-medium ${
                  currentPart > 2 ? 'text-white' : currentPart === 2 ? 'text-[#16a34a]' : 'text-gray-400'
                }`}
              >
                Part 2
              </span>
              {currentPart > 2 ? (
                <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.815a.75.75 0 011.05-.145z" clipRule="evenodd" />
                </svg>
              ) : (
                <div
                  className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium shrink-0 ${
                    currentPart === 2
                      ? 'border-2 border-[#16a34a] bg-white text-[#16a34a]'
                      : 'border border-gray-200 bg-white text-gray-300'
                  }`}
                >
                  1
                </div>
              )}
            </div>
          </div>

          {/* Part 3 */}
          <div
            className={`rounded-lg px-3 py-2 ${
              currentPart > 3 ? 'shrink-0 bg-[#16a34a]' : currentPart === 3 ? 'flex-1 border-2 border-[#16a34a] bg-white overflow-x-auto' : 'flex-1 border border-gray-200 bg-white overflow-x-auto'
            }`}
          >
            <div className="flex items-center gap-2 min-w-max">
              <span
                className={`text-sm font-medium ${
                  currentPart > 3 ? 'text-white' : currentPart === 3 ? 'text-[#16a34a]' : 'text-gray-400'
                }`}
              >
                Part 3
              </span>
              {currentPart > 3 ? (
                <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.815a.75.75 0 011.05-.145z" clipRule="evenodd" />
                </svg>
              ) : (
                <div className="flex gap-1.5 flex-wrap">
                  {Array.from({ length: finalConfig.part3 }).map((_, idx) => {
                    const isActive = currentPart === 3 && idx === currentQuestionIndex;
                    const isCompleted = currentPart > 3 || (currentPart === 3 && idx < currentQuestionIndex);

                    return (
                      <div
                        key={idx}
                        className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium shrink-0 ${
                          isActive
                            ? 'border-2 border-[#16a34a] bg-white text-[#16a34a]'
                            : isCompleted
                            ? 'border border-[#16a34a] bg-[#16a34a] text-white'
                            : 'border border-gray-200 bg-white text-gray-300'
                        }`}
                      >
                        {idx + 1}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-2 h-1.5 w-full rounded-full bg-gray-300">
          <div
            className="h-1.5 rounded-full bg-[#22c55e] transition-all duration-300"
            style={{
              width: `${calculateProgress(currentPart, currentQuestionIndex)}%`,
            }}
          />
        </div>
      </div>
    </div>
  );
}
