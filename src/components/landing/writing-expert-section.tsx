import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Gem, Search, GraduationCap, PenLine, ArrowRight } from "lucide-react"

const features = [
  {
    icon: Gem,
    title: "Công nghệ AI độc quyền",
    description: "Trả về Band Score chi tiết theo 4 tiêu chí chuẩn của kỳ thi IELTS.",
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
  {
    icon: Search,
    title: "Phân tích lỗi chi tiết",
    description: "Phát hiện lỗi từ vựng, ngữ pháp kèm đề xuất chỉnh sửa thông minh.",
    color: "text-rose-500",
    bgColor: "bg-rose-50",
  },
  {
    icon: GraduationCap,
    title: "Huấn luyện chuyên sâu",
    description: "Mô hình được train trên dữ liệu bài thi thực tế chuyên phân tích & chấm điểm.",
    color: "text-amber-500",
    bgColor: "bg-amber-50",
  },
  {
    icon: PenLine,
    title: "Chấm chữa chi tận tay",
    description: "Chỉ rõ điểm mạnh, điểm yếu giúp bạn nâng band nhanh chóng!",
    color: "text-blue-500",
    bgColor: "bg-blue-50",
  },
]

export function WritingExpertSection() {
  return (
    <section className="py-20 bg-white relative overflow-hidden">
      {/* Subtle decorative dots */}
      <div className="pointer-events-none absolute top-10 right-20 w-2 h-2 bg-amber-300/50 rounded-full animate-float-slow" />
      <div className="pointer-events-none absolute bottom-20 left-10 w-3 h-3 bg-primary/20 rounded-full animate-float-delayed" />

      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 bg-amber-50 text-amber-600 rounded-full px-4 py-1.5 text-sm font-medium mb-5">
            <div className="w-2 h-2 rounded-full bg-amber-400" />
            WRITING EXPERT AI
          </div>
          <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-3">
            Nâng tầm kỹ năng
            <br />
            <span className="text-primary italic">IELTS Writing</span>
          </h2>
          <p className="text-gray-500 text-lg max-w-2xl mx-auto">
            Đột phá điểm số với <span className="font-semibold text-gray-700">công nghệ AI độc quyền</span>, giúp bạn sửa lỗi và học hỏi
            phương pháp viết chuẩn học thuật. Mô hình được chúng tôi trực tiếp huấn luyện trên dữ liệu bài thi thực tế để phân tích lỗi và chấm điểm chính xác nhất.
          </p>
        </div>

        {/* Content Grid: Mockup + Features */}
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left: Writing Mockup Image */}
          <div className="relative flex justify-center">
            <div className="relative w-full max-w-md">
              {/* Background gradient */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-emerald-50/30 to-transparent rounded-3xl -m-4" />
              
              {/* Essay mockup cards */}
              <div className="relative space-y-4 p-4">
                <div className="bg-white rounded-xl p-5 shadow-md border border-gray-100 transform -rotate-1">
                  <h4 className="font-semibold text-gray-800 text-sm mb-2 flex items-center gap-2">
                    <div className="w-1 h-4 bg-primary rounded-full" />
                    Introduction
                  </h4>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    Opinions are divided on whether ...
                  </p>
                </div>

                <div className="bg-white rounded-xl p-5 shadow-md border border-gray-100 ml-8 transform rotate-1">
                  <h4 className="font-semibold text-gray-800 text-sm mb-2 flex items-center gap-2">
                    <div className="w-1 h-4 bg-amber-400 rounded-full" />
                    Body 1
                  </h4>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    Those who think that ...
                  </p>
                </div>

                <div className="bg-white rounded-xl p-5 shadow-md border border-gray-100 transform -rotate-0.5">
                  <h4 className="font-semibold text-gray-800 text-sm mb-2 flex items-center gap-2">
                    <div className="w-1 h-4 bg-blue-400 rounded-full" />
                    Conclusion
                  </h4>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    In conclusion, it is understandable why some may agree that ...
                  </p>
                </div>

                {/* Floating AI Badge */}
                <div className="absolute top-2 right-0 bg-primary text-white rounded-xl px-3 py-2 shadow-lg transform rotate-3">
                  <Gem className="w-5 h-5" />
                </div>
              </div>
            </div>
          </div>

          {/* Right: Feature Grid */}
          <div className="grid grid-cols-2 gap-4">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group"
              >
                <div className={`w-11 h-11 ${feature.bgColor} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className={`w-5 h-5 ${feature.color}`} />
                </div>
                <h4 className={`font-bold text-sm mb-2 ${feature.color}`}>{feature.title}</h4>
                <p className="text-xs text-gray-500 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Button */}
        <div className="text-center mt-12">
          <Button
            size="lg"
            className="text-base px-8 py-6 rounded-full shadow-lg shadow-primary/25 hover:shadow-xl hover:scale-105 transition-all duration-300 gap-2"
            asChild
          >
            <Link href="/register">
              Luyện IELTS Writing ngay
              <ArrowRight className="w-5 h-5" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
