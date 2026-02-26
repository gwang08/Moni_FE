import { Headphones, BookOpen, PenLine, Mic } from "lucide-react"

const features = [
  {
    icon: Headphones,
    title: "Listening",
    description:
      "Luyện nghe với các bài tập đa dạng, nâng cao khả năng nghe hiểu tiếng Anh học thuật",
    color: "bg-blue-100 text-blue-600",
    blob: "bg-blue-200",
  },
  {
    icon: BookOpen,
    title: "Reading",
    description:
      "Rèn luyện kỹ năng đọc hiểu qua các bài đọc chuyên sâu, phát triển vốn từ vựng",
    color: "bg-emerald-100 text-emerald-600",
    blob: "bg-emerald-200",
  },
  {
    icon: PenLine,
    title: "Writing",
    description:
      "Phát triển kỹ năng viết học thuật với hướng dẫn chi tiết và phản hồi cá nhân",
    color: "bg-amber-100 text-amber-600",
    blob: "bg-amber-200",
  },
  {
    icon: Mic,
    title: "Speaking",
    description:
      "Luyện tập nói với các chủ đề thực tế, tự tin giao tiếp trong mọi tình huống",
    color: "bg-rose-100 text-rose-600",
    blob: "bg-rose-200",
  },
]

export function FeaturesSection() {
  return (
    <section className="py-24 bg-gray-50/80">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <span className="text-primary font-semibold text-sm uppercase tracking-wider">
            Kỹ năng
          </span>
          <h2 className="text-3xl md:text-5xl font-bold mt-3 mb-4">
            Luyện tập toàn diện 4 kỹ năng
          </h2>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Phát triển đồng đều Listening, Reading, Writing, Speaking
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group relative bg-white rounded-3xl p-8 shadow-sm hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 overflow-hidden"
            >
              <div
                className={`absolute -top-6 -right-6 w-24 h-24 ${feature.blob} rounded-full blur-2xl opacity-40 group-hover:opacity-70 transition-opacity duration-500`}
              />

              <div className="relative">
                <div
                  className={`w-16 h-16 rounded-2xl ${feature.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}
                >
                  <feature.icon className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-bold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
