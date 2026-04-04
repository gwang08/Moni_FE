'use client';

interface Props {
  currentPart: number; // 0 = Intro, 1 = Part 1, 2 = Part 2, 3 = Part 3
  currentQuestionIndex: number; // 0-based index within the current part
}

const PART_CONFIG = {
  intro: { label: 'Intro', questionCount: 0 },
  part1: { label: 'Part 1', questionCount: 12 },
  part2: { label: 'Part 2', questionCount: 1 },
  part3: { label: 'Part 3', questionCount: 6 },
};

export function ExamProgressBar({ currentPart, currentQuestionIndex }: Props) {
  return (
    <div className="fixed bottom-0 left-0 right-0 border-t border-gray-200 bg-[#faf6f1] px-4 py-3">
      <div className="mx-auto max-w-6xl">
        <div className="flex items-start gap-2">
          {/* Intro */}
          <div
            className={`rounded-lg border-2 px-3 py-2 ${
              currentPart === 0
                ? 'border-[#22c55e] bg-white'
                : 'border-gray-200 bg-white'
            }`}
          >
            <div className="flex items-center gap-2">
              <span
                className={`text-sm font-medium ${
                  currentPart === 0 ? 'text-[#22c55e]' : 'text-gray-400'
                }`}
              >
                Intro
              </span>
              {currentPart === 0 && (
                <svg
                  className="h-5 w-5 text-gray-300"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                  />
                </svg>
              )}
            </div>
          </div>

          {/* Part 1 */}
          <div
            className={`flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2`}
          >
            <div className="flex items-center gap-2">
              <span
                className={`text-sm font-medium ${
                  currentPart === 1 ? 'text-[#2d3748]' : 'text-gray-400'
                }`}
              >
                Part 1
              </span>
              <div className="flex gap-1.5">
                {Array.from({ length: PART_CONFIG.part1.questionCount }).map((_, idx) => {
                  const isActive = currentPart === 1 && idx === currentQuestionIndex;
                  const isCompleted =
                    currentPart > 1 || (currentPart === 1 && idx < currentQuestionIndex);

                  return (
                    <div
                      key={idx}
                      className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium ${
                        isActive
                          ? 'border-2 border-[#22c55e] bg-white text-[#22c55e]'
                          : isCompleted
                          ? 'border-2 border-[#22c55e] bg-[#22c55e] text-white'
                          : 'border border-gray-300 text-gray-400'
                      }`}
                    >
                      {idx + 1}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Part 2 */}
          <div
            className={`rounded-lg border border-gray-200 bg-white px-3 py-2`}
          >
            <div className="flex items-center gap-2">
              <span
                className={`text-sm font-medium ${
                  currentPart === 2 ? 'text-[#2d3748]' : 'text-gray-400'
                }`}
              >
                Part 2
              </span>
              <div
                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium ${
                  currentPart === 2
                    ? 'border-2 border-[#22c55e] bg-white text-[#22c55e]'
                    : currentPart > 2
                    ? 'border-2 border-[#22c55e] bg-[#22c55e] text-white'
                    : 'border border-gray-300 text-gray-400'
                }`}
              >
                1
              </div>
            </div>
          </div>

          {/* Part 3 */}
          <div
            className={`flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2`}
          >
            <div className="flex items-center gap-2">
              <span
                className={`text-sm font-medium ${
                  currentPart === 3 ? 'text-[#2d3748]' : 'text-gray-400'
                }`}
              >
                Part 3
              </span>
              <div className="flex gap-1.5">
                {Array.from({ length: PART_CONFIG.part3.questionCount }).map((_, idx) => {
                  const isActive = currentPart === 3 && idx === currentQuestionIndex;
                  const isCompleted =
                    currentPart > 3 || (currentPart === 3 && idx < currentQuestionIndex);

                  return (
                    <div
                      key={idx}
                      className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium ${
                        isActive
                          ? 'border-2 border-[#22c55e] bg-white text-[#22c55e]'
                          : isCompleted
                          ? 'border-2 border-[#22c55e] bg-[#22c55e] text-white'
                          : 'border border-gray-300 text-gray-400'
                      }`}
                    >
                      {idx + 1}
                    </div>
                  );
                })}
              </div>
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

function calculateProgress(currentPart: number, currentQuestionIndex: number): number {
  const totalQuestions =
    PART_CONFIG.part1.questionCount +
    PART_CONFIG.part2.questionCount +
    PART_CONFIG.part3.questionCount;

  let completedQuestions = 0;

  if (currentPart === 0) {
    completedQuestions = 0;
  } else if (currentPart === 1) {
    completedQuestions = currentQuestionIndex;
  } else if (currentPart === 2) {
    completedQuestions = PART_CONFIG.part1.questionCount + currentQuestionIndex;
  } else if (currentPart === 3) {
    completedQuestions =
      PART_CONFIG.part1.questionCount +
      PART_CONFIG.part2.questionCount +
      currentQuestionIndex;
  } else {
    completedQuestions = totalQuestions;
  }

  return (completedQuestions / totalQuestions) * 100;
}
