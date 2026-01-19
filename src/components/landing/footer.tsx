import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export function Footer() {
  return (
    <footer className="py-12 bg-white text-black border-t">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="flex flex-col h-full">
            <div className="h-6 flex items-center mb-4">
              <Image
                src="/logo.png"
                alt="Moni"
                width={80}
                height={24}
                className="object-contain"
              />
            </div>
            <div className="flex gap-2 mb-2">
              <Input
                type="email"
                placeholder="Email của bạn"
                className="text-sm h-8"
              />
              <Button size="sm" className="h-8">Gửi</Button>
            </div>
            <p className="text-gray-600 text-sm">
              Nền tảng luyện thi IELTS thông minh giúp bạn đạt điểm cao.
            </p>
          </div>

          <div className="flex flex-col h-full">
            <h4 className="font-semibold h-6 flex items-center mb-4">Kỹ năng</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li><a href="#" className="hover:text-primary">Reading</a></li>
              <li><a href="#" className="hover:text-primary">Listening</a></li>
              <li><a href="#" className="hover:text-primary">Writing</a></li>
              <li><a href="#" className="hover:text-primary">Speaking</a></li>
            </ul>
          </div>

          <div className="flex flex-col h-full">
            <h4 className="font-semibold h-6 flex items-center mb-4">Hỗ trợ</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li><a href="#" className="hover:text-primary">Hướng dẫn</a></li>
              <li><a href="#" className="hover:text-primary">FAQ</a></li>
              <li><a href="#" className="hover:text-primary">Liên hệ</a></li>
              <li><a href="#" className="hover:text-primary">Góp ý</a></li>
            </ul>
          </div>

          <div className="flex flex-col h-full">
            <h4 className="font-semibold h-6 flex items-center mb-4">Liên hệ</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>Email: contact@moni.vn</li>
              <li>Hotline: 1900 xxxx</li>
              <li className="flex gap-4 pt-2">
                <a href="#" className="hover:text-primary">Facebook</a>
                <a href="#" className="hover:text-primary">Youtube</a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t pt-6 text-center text-sm text-gray-500">
          © 2026 Moni. All rights reserved.
        </div>
      </div>
    </footer>
  )
}
