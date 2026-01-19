import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const features = [
  {
    icon: "🎧",
    title: "Listening",
    description: "Luyện nghe với các bài tập đa dạng, nâng cao khả năng nghe hiểu tiếng Anh học thuật"
  },
  {
    icon: "📖",
    title: "Reading",
    description: "Rèn luyện kỹ năng đọc hiểu qua các bài đọc chuyên sâu, phát triển vốn từ vựng"
  },
  {
    icon: "✍️",
    title: "Writing",
    description: "Phát triển kỹ năng viết học thuật với hướng dẫn chi tiết và phản hồi cá nhân"
  },
  {
    icon: "🎤",
    title: "Speaking",
    description: "Luyện tập nói với các chủ đề thực tế, tự tin giao tiếp trong mọi tình huống"
  }
]

export function FeaturesSection() {
  return (
    <section className="relative py-20 pt-24 bg-white wave-section">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Luyện tập toàn diện 4 kỹ năng
          </h2>
          <p className="text-lg text-muted-foreground">
            Phát triển đồng đều các kỹ năng Listening, Reading, Writing, Speaking
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature) => (
            <Card key={feature.title} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="text-5xl mb-4">{feature.icon}</div>
                <CardTitle>{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
