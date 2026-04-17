import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { BookOpen, Headphones, MessageCircle, PenLine, ArrowRight } from "lucide-react"

const examFeatures = [
  { icon: BookOpen, label: "Đề Reading chuẩn Cambridge", color: "text-primary", bgColor: "bg-primary/10" },
  { icon: Headphones, label: "Đề Listening format thi thật", color: "text-rose-500", bgColor: "bg-rose-50" },
  { icon: MessageCircle, label: "Speaking thực chiến AI 1:1", color: "text-blue-500", bgColor: "bg-blue-50" },
  { icon: PenLine, label: "Writing chấm chữa chuyên sâu", color: "text-amber-500", bgColor: "bg-amber-50" },
]

export function CambridgeOfficialSection() {
  return (
    <section className="py-20 bg-gradient-to-b from-white to-gray-50/50 relative overflow-hidden">
      {/* Decorative elements */}
      <div className="pointer-events-none absolute top-40 right-10 w-3 h-3 bg-amber-300/40 rounded-full animate-float-slow" />
      <div className="pointer-events-none absolute bottom-20 left-20 w-2 h-2 bg-primary/30 rounded-full animate-float-delayed" />

      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Column: Content */}
          <div>
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary rounded-full px-4 py-1.5 text-sm font-medium mb-6">
              <div className="w-2 h-2 rounded-full bg-primary" />
              CAMBRIDGE OFFICIAL
            </div>

            <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-3 leading-tight">
              Thi thử IELTS chuẩn
              <br />
              <span className="text-primary italic">Cambridge Official</span>
            </h2>

            <p className="text-gray-500 text-base mb-8 max-w-md leading-relaxed">
              Luyện tập đầy đủ 4 kỹ năng từ các đầu sách nổi tiếng, bám sát format thi thật, giúp bạn tự tin trước kỳ thi chính thức!
            </p>

            {/* Feature pills */}
            <div className="grid grid-cols-2 gap-3 mb-8 max-w-lg">
              {examFeatures.map((feature) => (
                <div
                  key={feature.label}
                  className="flex items-center gap-3 bg-white rounded-2xl px-4 py-3.5 shadow-sm border border-gray-100 hover:shadow-md hover:border-primary/20 transition-all duration-300"
                >
                  <div className={`w-9 h-9 rounded-xl ${feature.bgColor} flex items-center justify-center shrink-0`}>
                    <feature.icon className={`w-4.5 h-4.5 ${feature.color}`} />
                  </div>
                  <span className="text-sm font-medium text-gray-700">{feature.label}</span>
                </div>
              ))}
            </div>

            {/* CTA */}
            <Button
              size="lg"
              className="text-base px-8 py-6 rounded-full shadow-lg shadow-primary/25 hover:shadow-xl hover:scale-105 transition-all duration-300 gap-2"
              asChild
            >
              <Link href="/register">
                Luyện tập ngay
                <ArrowRight className="w-5 h-5" />
              </Link>
            </Button>
          </div>

          {/* Right Column: Cambridge books image */}
          <div className="relative flex justify-center lg:justify-end">
            <div className="relative w-[340px] h-[340px] sm:w-[420px] sm:h-[420px]">
              {/* Background glow */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-emerald-50/30 to-transparent rounded-full scale-110 blur-xl" />
              
              <Image
                src="/cambridge-books.png"
                alt="IELTS Cambridge Official Books"
                fill
                className="object-contain z-10 relative drop-shadow-lg"
                sizes="(max-width: 640px) 340px, 420px"
              />

              {/* Floating badge */}
              <div className="absolute bottom-8 left-4 bg-white rounded-2xl px-4 py-3 shadow-lg border border-gray-100 z-20 animate-float-slow">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center">
                    <span className="text-amber-500 text-sm">⭐</span>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-700">Official Test</p>
                    <p className="text-xs text-gray-400">Cambridge IELTS</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
