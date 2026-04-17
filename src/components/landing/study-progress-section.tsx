"use client"

import { Flame, Trophy } from "lucide-react"

// Generate a simple heatmap data visualization
const months = ["Th1", "Th2", "Th3", "Th4", "Th5", "Th6", "Th7"]
const weekdays = ["CN", "T2", "T4", "T6"]

function HeatmapGrid() {
  // Generate random activity data for demonstration
  const generateActivity = () => {
    const levels = [0, 0, 0, 1, 1, 2, 2, 3, 4] // weighted towards low activity
    return levels[Math.floor(Math.random() * levels.length)]
  }

  const colors: Record<number, string> = {
    0: "bg-gray-100",
    1: "bg-primary/15",
    2: "bg-primary/30",
    3: "bg-primary/50",
    4: "bg-primary/80",
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h4 className="font-semibold text-gray-900">Hoạt động học tập</h4>
          <p className="text-sm text-gray-400">12 bài luyện tập trong năm 2026</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <span>Ít</span>
          {[0, 1, 2, 3, 4].map((level) => (
            <div
              key={level}
              className={`w-3 h-3 rounded-sm ${colors[level]}`}
            />
          ))}
          <span>Nhiều</span>
        </div>
      </div>

      {/* Month headers */}
      <div className="flex gap-0 mb-1 pl-8">
        {months.map((month) => (
          <div key={month} className="flex-1 text-xs text-gray-400 text-center">
            {month}
          </div>
        ))}
      </div>

      {/* Heatmap grid */}
      <div className="space-y-1">
        {weekdays.map((day) => (
          <div key={day} className="flex items-center gap-1">
            <span className="w-7 text-xs text-gray-400 shrink-0">{day}</span>
            <div className="flex-1 flex gap-[3px]">
              {Array.from({ length: 30 }, (_, i) => (
                <div
                  key={i}
                  className={`flex-1 aspect-square rounded-sm ${colors[generateActivity()]} min-w-[8px] max-w-[14px]`}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div className="mt-4 flex items-center gap-2">
        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-primary/60 to-primary rounded-full w-2/3 transition-all" />
        </div>
      </div>
    </div>
  )
}

export function StudyProgressSection() {
  return (
    <section className="py-20 bg-gradient-to-b from-white to-gray-50/80">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary rounded-full px-4 py-1.5 text-sm font-medium mb-5">
            <div className="w-2 h-2 rounded-full bg-primary" />
            STUDY PROGRESS
          </div>
          <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-3">
            Theo dõi hành trình –
            <br />
            <span className="text-primary italic">Bứt phá mỗi ngày</span>
          </h2>
          <p className="text-gray-500 text-lg max-w-xl mx-auto">
            Mỗi ô vuông nhỏ là một bước tiến trên con đường chinh phục IELTS của bạn
          </p>
        </div>

        {/* Content Grid */}
        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Heatmap - takes 2 cols */}
          <div className="lg:col-span-2">
            <HeatmapGrid />
          </div>

          {/* Stats cards */}
          <div className="space-y-6">
            {/* Streak card */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-300">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Flame className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-primary uppercase tracking-wider">Chuỗi học tập</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">0 <span className="text-lg font-medium text-gray-400">ngày</span></p>
                  <p className="text-sm text-gray-400 mt-1">Tiếp tục phát huy nhé!</p>
                </div>
              </div>
            </div>

            {/* Total practice card */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-300">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                  <Trophy className="w-5 h-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-amber-500 uppercase tracking-wider">Tổng luyện tập</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">12 <span className="text-lg font-medium text-gray-400">bài</span></p>
                  <p className="text-sm text-gray-400 mt-1">+9 bài tuần này</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
