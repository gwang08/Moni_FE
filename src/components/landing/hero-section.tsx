import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Headphones, BookOpen, Star } from "lucide-react"

export function HeroSection() {
  return (
    <section className="relative bg-white pt-20 pb-0 overflow-hidden min-h-screen flex flex-col">
      {/* Subtle background blobs for depth */}
      <div className="pointer-events-none absolute -top-32 -left-32 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      <div className="pointer-events-none absolute top-10 right-0 w-80 h-80 bg-blue-100/40 rounded-full blur-3xl" />

      {/* Main content: two-column layout */}
      <div className="container mx-auto px-4 flex-1 flex items-center">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center w-full py-12 lg:py-20">

          {/* ── Left column: copy + CTAs ── */}
          <div className="text-center lg:text-left">
            {/* Eyebrow tag */}
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary rounded-full px-4 py-1.5 text-sm font-semibold mb-6">
              <Star className="w-3.5 h-3.5 fill-primary" />
              Nền tảng luyện IELTS #1 Việt Nam
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold leading-tight tracking-tight text-gray-900 mb-5">
              Chinh phục{" "}
              <span className="text-primary">IELTS</span>
              <br />
              cùng Moni
            </h1>

            <p className="text-lg md:text-xl text-gray-500 mb-8 max-w-lg mx-auto lg:mx-0 leading-relaxed">
              Xây nền tiếng vững — Bứt phá điểm số
            </p>

            {/* CTA buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start mb-12">
              <Button
                size="lg"
                className="text-base px-8 py-6 rounded-full shadow-lg hover:scale-105 transition-transform"
                asChild
              >
                <Link href="/register">Bắt đầu miễn phí</Link>
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="text-base px-8 py-6 rounded-full border-2 border-primary text-primary hover:bg-primary hover:text-white transition-all"
                asChild
              >
                <Link href="#programs">Tìm hiểu thêm</Link>
              </Button>
            </div>

            {/* Decorative icon pills */}
            <div className="flex flex-wrap gap-3 justify-center lg:justify-start">
              <span className="flex items-center gap-2 bg-blue-50 text-blue-600 rounded-full px-4 py-2 text-sm font-medium">
                <Headphones className="w-4 h-4" /> Listening & Speaking
              </span>
              <span className="flex items-center gap-2 bg-emerald-50 text-emerald-600 rounded-full px-4 py-2 text-sm font-medium">
                <BookOpen className="w-4 h-4" /> Reading & Writing
              </span>
            </div>
          </div>

          {/* ── Right column: single image ── */}
          <div className="relative flex justify-center lg:justify-end">
            <div className="relative w-[340px] h-[400px] sm:w-[460px] sm:h-[480px]">
              <div className="relative w-full h-full rounded-3xl overflow-hidden shadow-2xl">
                <Image
                  src="/login.png"
                  alt="Moni IELTS Learning"
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 340px, 460px"
                  priority
                />
              </div>

              {/* Pastel blob behind */}
              <div className="absolute inset-0 -z-10 rounded-full bg-gradient-to-br from-primary/10 via-blue-100/30 to-emerald-100/20 blur-2xl scale-110" />
            </div>
          </div>
        </div>
      </div>

    </section>
  )
}
