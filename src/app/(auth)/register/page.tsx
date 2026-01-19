import { RegisterForm } from '@/components/auth/register-form';
import Image from 'next/image';
import Link from 'next/link';

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex">
      {/* Left side - Background */}
      <div className="hidden lg:block flex-1 relative bg-gradient-to-br from-primary/10 to-primary/5">
        <div className="absolute inset-0 flex items-center justify-center p-12">
          <div className="text-center">
            <h2 className="text-3xl font-bold mb-4">Bắt đầu ngay hôm nay!</h2>
            <p className="text-lg text-muted-foreground">
              Xây nền tiếng vững - Bứt phá điểm số
            </p>
          </div>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md">
          <div className="flex justify-center mb-4">
            <Image
              src="/logo.png"
              alt="Moni IELTS"
              width={200}
              height={65}
              className="h-20 w-auto"
            />
          </div>

          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold mb-2">Đăng ký tài khoản</h1>
            <p className="text-muted-foreground">
              Tạo tài khoản miễn phí để bắt đầu luyện tập
            </p>
          </div>

          <RegisterForm />
        </div>
      </div>
    </div>
  );
}
