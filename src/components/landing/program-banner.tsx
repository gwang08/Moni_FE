import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"

interface ProgramBannerProps {
  image: string
  alt: string
  label: string
  title: string
  description: string
  ctaText?: string
  ctaHref?: string
  overlay?: "left" | "right" | "center"
}

export function ProgramBanner({
  image,
  alt,
  label,
  title,
  description,
  ctaText = "Tìm hiểu thêm",
  ctaHref = "#",
  overlay = "left",
}: ProgramBannerProps) {
  const gradientClass = {
    left: "bg-linear-to-r from-black/80 via-black/40 to-transparent",
    right: "bg-linear-to-l from-black/80 via-black/40 to-transparent",
    center: "bg-linear-to-t from-black/80 via-black/30 to-transparent",
  }[overlay]

  const contentPosition = {
    left: "items-start text-left justify-center",
    right: "items-end text-right justify-center",
    center: "items-center text-center justify-end",
  }[overlay]

  const contentPadding = {
    left: "pl-8 md:pl-16 pr-8",
    right: "pr-8 md:pr-16 pl-8",
    center: "px-8 pb-8",
  }[overlay]

  return (
    <section className="py-6 md:py-10">
      <div className="container mx-auto px-4">
        <div className="relative min-h-[280px] md:min-h-[380px] rounded-3xl overflow-hidden shadow-xl group cursor-pointer">
          <Image
            src={image}
            alt={alt}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, 1400px"
          />

          <div
            className={`absolute inset-0 ${gradientClass} transition-opacity duration-300`}
          />

          <div
            className={`relative z-10 flex flex-col ${contentPosition} ${contentPadding} h-full min-h-[280px] md:min-h-[380px]`}
          >
            <div className="max-w-md">
              <span className="inline-block px-3 py-1 rounded-full bg-primary/90 text-white text-xs font-semibold uppercase tracking-wider mb-4">
                {label}
              </span>
              <h2 className="text-2xl md:text-4xl font-bold text-white mb-3 leading-tight">
                {title}
              </h2>
              <p className="text-white/80 text-sm md:text-base mb-6 leading-relaxed">
                {description}
              </p>
              <Button
                className="rounded-full bg-white text-black hover:bg-white/90 transition-all gap-2"
                asChild
              >
                <Link href={ctaHref}>
                  {ctaText}
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
