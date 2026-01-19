const steps = [
  {
    number: 1,
    title: "Đặt mục tiêu",
    description: "Xác định band điểm mục tiêu và lộ trình học tập phù hợp với bạn"
  },
  {
    number: 2,
    title: "Luyện tập",
    description: "Học theo lộ trình cá nhân hóa với bài tập đa dạng và phong phú"
  },
  {
    number: 3,
    title: "Nhận phản hồi",
    description: "Theo dõi tiến độ và nhận phản hồi chi tiết để cải thiện kỹ năng"
  }
]

export function HowItWorksSection() {
  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Cách thức hoạt động
          </h2>
          <p className="text-lg text-muted-foreground">
            Chỉ 3 bước đơn giản để bắt đầu hành trình chinh phục IELTS
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((step, index) => (
              <div key={step.number} className="relative text-center">
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 rounded-full bg-primary text-white flex items-center justify-center text-2xl font-bold mb-4">
                    {step.number}
                  </div>
                  <h3 className="text-xl font-bold mb-2">{step.title}</h3>
                  <p className="text-muted-foreground">{step.description}</p>
                </div>

                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-[60%] w-[80%] h-0.5 bg-gray-300" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
