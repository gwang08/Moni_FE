import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Sparkles, Star, ShieldCheck, BookOpen, ArrowRight, Cpu } from "lucide-react"

const featurePills = [
  { icon: Cpu, label: "Công nghệ AI độc quyền" },
  { icon: Star, label: "Cá nhân hóa lộ trình" },
  { icon: ShieldCheck, label: "Bảo mật & Tin cậy" },
  { icon: BookOpen, label: "Nguồn đề đa dạng" },
]

export function HeroSection() {
  return (
    <section className="relative bg-gradient-to-br from-white via-emerald-50/30 to-green-50/50 pt-24 pb-16 overflow-hidden min-h-[90vh] flex items-center">
      {/* Decorative floating elements */}
      <div className="pointer-events-none absolute top-20 right-[10%] w-2 h-2 bg-primary/40 rounded-full animate-float-slow" />
      <div className="pointer-events-none absolute top-40 left-[5%] w-3 h-3 bg-amber-300/50 rounded-full animate-float-delayed" />
      <div className="pointer-events-none absolute bottom-40 right-[20%] w-2 h-2 bg-primary/30 rounded-full animate-float-slow" />

      {/* Subtle background shapes */}
      <div className="pointer-events-none absolute -top-32 -left-32 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      <div className="pointer-events-none absolute top-10 right-0 w-80 h-80 bg-emerald-100/40 rounded-full blur-3xl" />

      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-8 items-center">
          {/* Left Column: Copy */}
          <div className="text-left">
            <h1 className="text-3xl sm:text-3xl lg:text-4xl font-extrabold leading-[1.2] tracking-tight text-gray-900 mb-6">
              Chinh phục{" "}
              <span className="text-primary">IELTS 7.0-8.5</span>
              <br />
              Dễ dàng hơn bao giờ hết!
            </h1>

            <p className="text-base md:text-lg text-gray-500 mb-8 max-w-lg leading-relaxed">
              Kết hợp phương pháp chuẩn Cambridge với{" "}
              <span className="text-primary font-semibold">Mô hình AI huấn luyện độc quyền</span>.
              Hệ thống đánh giá dựa trên dữ liệu thi thực tế,
              phân tích lỗi chuẩn xác giúp bạn bứt phá band điểm Writing & Speaking chỉ sau 30 ngày.
            </p>

            {/* Feature pills grid */}
            <div className="grid grid-cols-2 gap-3 mb-8 max-w-lg">
              {featurePills.map((pill) => (
                <div
                  key={pill.label}
                  className="flex items-center gap-3 bg-white rounded-2xl px-4 py-3.5 shadow-sm border border-gray-100 hover:shadow-md hover:border-primary/20 transition-all duration-300"
                >
                  <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <pill.icon className="w-4.5 h-4.5 text-primary" />
                  </div>
                  <span className="text-sm font-medium text-gray-700">{pill.label}</span>
                </div>
              ))}
            </div>

            {/* CTA Button */}
            <Button
              size="lg"
              className="text-base px-8 py-6 rounded-full shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 hover:scale-105 transition-all duration-300 gap-2 bg-primary hover:bg-primary/90"
              asChild
            >
              <Link href="/register">
                Bắt đầu ngay hôm nay
                <ArrowRight className="w-5 h-5" />
              </Link>
            </Button>
          </div>

          {/* Right Column: Mascot Illustration */}
          <div className="relative flex justify-center lg:justify-end">
            <div className="relative w-[350px] h-[350px] sm:w-[450px] sm:h-[450px] lg:w-[500px] lg:h-[500px]">
              {/* Background circle */}
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-100/60 via-green-50/40 to-teal-100/30 rounded-full scale-90" />

              {/* Mascot image */}
              <Image
                src="/hero-mascot.png"
                alt="Moni IELTS Learning Mascot"
                fill
                className="object-contain z-10 relative mix-blend-multiply"
                sizes="(max-width: 640px) 350px, (max-width: 1024px) 450px, 500px"
                priority
              />

              {/* Floating badge - Success rate */}
              <div className="absolute bottom-16 left-0 sm:left-4 bg-white rounded-2xl px-4 py-3 shadow-lg border border-gray-100 z-20 animate-float-slow">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-gray-900">6.5+ Band</p>
                    <p className="text-xs text-gray-500">Average Success</p>
                  </div>
                </div>
              </div>

              {/* Floating badge - Learn Smarter */}
              <div className="absolute top-8 right-0 bg-white rounded-2xl px-4 py-2.5 shadow-lg border border-gray-100 z-20 animate-float-delayed">
                <p className="text-sm font-medium text-gray-700">Learn Smarter,</p>
                <p className="text-sm font-bold text-primary">Score Better</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
