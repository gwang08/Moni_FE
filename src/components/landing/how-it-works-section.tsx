import { Target, BookOpenCheck, TrendingUp } from "lucide-react"

const steps = [
  {
    icon: Target,
    title: "Đặt mục tiêu",
    description:
      "Xác định band điểm mục tiêu và lộ trình học tập phù hợp với bạn",
  },
  {
    icon: BookOpenCheck,
    title: "Luyện tập",
    description:
      "Học theo lộ trình cá nhân hóa với bài tập đa dạng và phong phú",
  },
  {
    icon: TrendingUp,
    title: "Nhận phản hồi",
    description:
      "Theo dõi tiến độ và nhận phản hồi chi tiết để cải thiện kỹ năng",
  },
]

export function HowItWorksSection() {
  return (
    <section className="py-24 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <span className="text-primary font-semibold text-sm uppercase tracking-wider">
            Quy trình
          </span>
          <h2 className="text-3xl md:text-5xl font-bold mt-3 mb-4">
            Bắt đầu chỉ với 3 bước
          </h2>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Hành trình chinh phục IELTS chưa bao giờ đơn giản đến thế
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
            <div className="hidden md:block absolute top-6 left-[calc(16.67%+28px)] right-[calc(16.67%+28px)] border-t-2 border-dashed border-primary/20" />

            {steps.map((step, index) => (
              <div
                key={step.title}
                className="flex flex-col items-center text-center"
              >
                <div className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center text-lg font-bold mb-8 relative z-10 shadow-lg shadow-primary/25">
                  {index + 1}
                </div>

                <div className="w-16 h-16 rounded-2xl bg-primary/5 flex items-center justify-center mb-5">
                  <step.icon className="w-8 h-8 text-primary" />
                </div>

                <h3 className="text-xl font-bold mb-2">{step.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed max-w-[240px]">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
