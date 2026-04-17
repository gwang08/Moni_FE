import { BookOpen, Headphones, PenLine, Mic } from "lucide-react"

const skills = [
  {
    title: "READING",
    icon: BookOpen,
    color: "text-emerald-600",
    bgIcon: "bg-emerald-50",
    barColor: "bg-primary",
    description: "Đề Reading chuẩn Cambridge, phân tích chi tiết từng câu hỏi",
  },
  {
    title: "LISTENING",
    icon: Headphones,
    color: "text-blue-600",
    bgIcon: "bg-blue-50",
    barColor: "bg-blue-500",
    description: "Luyện nghe với audio chuẩn format thi thật IELTS",
  },
  {
    title: "WRITING",
    icon: PenLine,
    color: "text-rose-500",
    bgIcon: "bg-rose-50",
    barColor: "bg-rose-400",
    description: "AI chấm chữa Writing Task 1 & 2 chi tiết theo 4 tiêu chí",
  },
  {
    title: "SPEAKING",
    icon: Mic,
    color: "text-amber-500",
    bgIcon: "bg-amber-50",
    barColor: "bg-amber-400",
    description: "Thực chiến Speaking AI 1:1, feedback phát âm & ngữ pháp",
  },
]

export function SmartLearningSection() {
  return (
    <section className="py-20 bg-gradient-to-b from-gray-50/80 to-white relative overflow-hidden">
      {/* Subtle decorative elements */}
      <div className="pointer-events-none absolute top-20 left-10 w-3 h-3 bg-amber-300/40 rounded-full animate-float-slow" />
      <div className="pointer-events-none absolute bottom-32 right-16 w-2 h-2 bg-primary/30 rounded-full animate-float-delayed" />

      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary rounded-full px-4 py-1.5 text-sm font-medium mb-5">
            <div className="w-2 h-2 rounded-full bg-primary" />
            SMART LEARNING PATH
          </div>
          <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-3">
            Luyện tập thông minh –
            <br />
            <span className="text-primary italic">Bứt phá điểm số IELTS</span>
          </h2>
          <p className="text-gray-500 text-lg max-w-2xl mx-auto">
            Moni giúp bạn tối ưu hóa thời gian học, phản hồi chi tiết cho từng kỹ năng!
          </p>
        </div>

        {/* Skill Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
          {skills.map((skill, index) => (
            <div
              key={skill.title}
              className="group bg-white rounded-3xl p-7 shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-2 transition-all duration-500 cursor-pointer relative overflow-hidden"
            >
              {/* Hover background glow */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              <div className="relative">
                {/* Skill Title */}
                <h3 className={`text-sm font-bold tracking-wider ${skill.color} mb-6`}>
                  {skill.title}
                </h3>

                {/* Icon */}
                <div className={`w-16 h-16 ${skill.bgIcon} rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300`}>
                  <skill.icon className={`w-8 h-8 ${skill.color}`} />
                </div>

                {/* Decorative bar */}
                <div className={`w-12 h-1.5 ${skill.barColor} rounded-full mb-4 group-hover:w-20 transition-all duration-500`} />

                {/* Description */}
                <p className="text-sm text-gray-500 leading-relaxed">
                  {skill.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
