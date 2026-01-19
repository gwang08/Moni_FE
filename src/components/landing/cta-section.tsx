import { Button } from "@/components/ui/button"

export function CTASection() {
  return (
    <section className="py-20 bg-primary text-white">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
          Sẵn sàng chinh phục IELTS?
        </h2>
        <p className="text-xl md:text-2xl mb-8 text-white/90 max-w-2xl mx-auto">
          Bắt đầu hành trình học tập của bạn ngay hôm nay và đạt được band điểm mơ ước
        </p>
        <Button size="lg" variant="secondary" className="text-lg px-8 py-6">
          Bắt đầu ngay
        </Button>
      </div>
    </section>
  )
}
