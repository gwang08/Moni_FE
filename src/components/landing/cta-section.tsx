import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, Sparkles } from "lucide-react"

export function CTASection() {
  return (
    <section className="py-24 bg-gradient-to-br from-primary via-emerald-600 to-teal-700 text-white relative overflow-hidden">
      {/* Decorative shapes */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
      <div className="absolute top-1/2 left-1/2 w-[600px] h-[600px] bg-white/3 rounded-full -translate-x-1/2 -translate-y-1/2" />

      <div className="container mx-auto px-4 text-center relative z-10">
        <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-full px-5 py-2 text-sm font-medium mb-8">
          <Sparkles className="w-4 h-4" />
          Bắt đầu miễn phí ngay hôm nay
        </div>

        <h2 className="text-3xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
          Sẵn sàng chinh phục IELTS?
        </h2>
        <p className="text-lg md:text-xl mb-10 text-white/80 max-w-2xl mx-auto leading-relaxed">
          Bắt đầu hành trình học tập ngay hôm nay và đạt được band điểm mơ ước cùng Moni
        </p>
        <Button
          size="lg"
          variant="secondary"
          className="text-base px-8 py-6 rounded-full shadow-2xl hover:scale-105 transition-all duration-300 gap-2 bg-white text-primary hover:bg-white/95"
          asChild
        >
          <Link href="/register">
            Bắt đầu miễn phí
            <ArrowRight className="w-5 h-5" />
          </Link>
        </Button>
      </div>
    </section>
  )
}
