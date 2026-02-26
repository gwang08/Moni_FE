import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ChevronDown } from "lucide-react"

const stats = [
  { value: "10,000+", label: "Học viên" },
  { value: "30+", label: "Quốc gia" },
  { value: "20+", label: "Năm kinh nghiệm" },
  { value: "98%", label: "Hài lòng" },
]

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <video
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
        poster="/Moni1.png"
      >
        <source src="/Moni-video.mp4" type="video/mp4" />
      </video>

      <div className="absolute inset-0 bg-linear-to-b from-black/40 via-black/25 to-black/50" />

      <div className="relative z-10 container mx-auto px-4 text-center text-white">
       

        <h1 className="text-5xl md:text-7xl lg:text-8xl font-extrabold mb-6 leading-tight tracking-tight">
          Chinh phục{" "}
          <span className="text-primary">IELTS</span>
          <br />
          cùng Moni
        </h1>

        <p className="text-lg md:text-2xl mb-12 text-white/80 max-w-2xl mx-auto font-light leading-relaxed">
          Xây nền tiếng vững — Bứt phá điểm số
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-20">
          <Button
            size="lg"
            className="text-base px-8 py-6 rounded-full shadow-2xl hover:scale-105 transition-transform"
            asChild
          >
            <Link href="/register">Bắt đầu miễn phí</Link>
          </Button>
          <Button
            size="lg"
            className="text-base px-8 py-6 rounded-full bg-white/20 text-white backdrop-blur-sm hover:bg-white hover:text-black transition-all"
            asChild
          >
            <Link href="#programs">Tìm hiểu thêm</Link>
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-12 max-w-3xl mx-auto">
          {stats.map((stat) => (
            <div key={stat.label}>
              <div className="text-3xl md:text-4xl font-bold mb-1">
                {stat.value}
              </div>
              <div className="text-xs md:text-sm text-white/50 uppercase tracking-wider">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <ChevronDown className="w-6 h-6 text-white/50" />
      </div>
    </section>
  )
}
