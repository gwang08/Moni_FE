import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"

export function CTASection() {
  return (
    <section className="py-24 bg-linear-to-br from-teal-600 via-teal-700 to-teal-900 text-white relative overflow-hidden">
      <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />

      <div className="container mx-auto px-4 text-center relative z-10">
        <h2 className="text-3xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
          Sẵn sàng chinh phục IELTS?
        </h2>
        <p className="text-lg md:text-xl mb-10 text-white/80 max-w-2xl mx-auto leading-relaxed">
          Bắt đầu hành trình học tập ngay hôm nay và đạt được band điểm mơ ước
        </p>
        <Button
          size="lg"
          variant="secondary"
          className="text-base px-8 py-6 rounded-full shadow-2xl hover:scale-105 transition-transform gap-2"
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
