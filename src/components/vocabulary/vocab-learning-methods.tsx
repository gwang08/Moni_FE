import Link from 'next/link';
import Image from 'next/image';

const METHODS = [
  { href: '/vocabulary/flashcard', label: 'Flashcard',
    desc: 'Ôn tập với thẻ lật và Spaced Repetition', img: '/vocab/method-flashcard.jpg' },
  { href: '/vocabulary/quiz', label: 'Trắc Nghiệm',
    desc: 'Kiểm tra kiến thức với câu hỏi trắc nghiệm', img: '/vocab/method-quiz.jpg' },
  { href: '/vocabulary/word-match', label: 'Nối Từ',
    desc: 'Ghép từ với nghĩa tương ứng', img: '/vocab/method-match.jpg' },
];

export function VocabLearningMethods() {
  return (
    <section>
      <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-1">Phương Pháp Học</h2>
      <div className="h-px bg-gray-100 mb-5" />
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {METHODS.map(m => (
          <Link key={m.href} href={m.href}
            className="group block rounded-lg border border-gray-200 bg-white
              hover:shadow-lg transition-all duration-300">
            <div className="p-4">
              <div className="w-full h-44 mb-3 rounded-lg overflow-hidden bg-gray-100 relative">
                <Image src={m.img} alt={m.label} fill
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
              </div>
              <p className="font-semibold text-[16px] leading-[20px] line-clamp-2 mb-2">{m.label}</p>
              <p className="text-sm text-muted-foreground mb-3">{m.desc}</p>
              <span className="inline-flex items-center justify-center w-full h-10 text-sm
                font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/80 transition-all">
                Bắt đầu Học
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
