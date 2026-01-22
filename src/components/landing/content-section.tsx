import Image from "next/image"

export function ContentSection() {
  return (
    <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="relative h-[400px] lg:h-[500px] rounded-2xl overflow-hidden shadow-xl">
            <Image
              src="/content.jpg"
              alt="Content"
              fill
              className="object-cover"
            />
          </div>

          <div className="space-y-6">
            <h2 className="text-3xl md:text-4xl font-bold">
              Mơ cao vươn xa
            </h2>
            <h3 className="text-2xl md:text-3xl font-semibold text-primary">
              Hành trình chinh phục IELTS
            </h3>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Với Moni, bạn không chỉ học IELTS mà còn xây dựng nền tảng tiếng Anh vững chắc.
              Chúng tôi đồng hành cùng bạn từng bước, giúp bạn tự tin đạt được mục tiêu của mình.
            </p>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Hệ thống bài tập đa dạng, phương pháp học tập hiệu quả và công nghệ hiện đại
              sẽ giúp bạn tiến bộ mỗi ngày.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
