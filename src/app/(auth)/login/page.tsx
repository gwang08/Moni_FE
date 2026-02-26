import { LoginForm } from '@/components/auth/login-form';
import Image from 'next/image';
import { BookOpen, PenLine, Headphones, Mic } from 'lucide-react';

const features = [
  { icon: BookOpen, label: 'Reading', desc: 'Đọc hiểu chuyên sâu' },
  { icon: PenLine, label: 'Writing', desc: 'Luyện viết có phản hồi AI' },
  { icon: Headphones, label: 'Listening', desc: 'Nghe hiểu mọi giọng điệu' },
  { icon: Mic, label: 'Speaking', desc: 'Nói tự tin với AI coach' },
];

const testAccounts = [
  { email: 'admin@cap.vn', password: 'admin123', label: 'Admin' },
  { email: 'expert@cap.vn', password: '12345678', label: 'Expert' },
];

export default function LoginPage() {
  return (
    <div className="min-h-screen flex">
      {/* Left panel - Login form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md">
          <div className="flex justify-center mb-4">
            <Image
              src="/Moni-logo.png"
              alt="Moni IELTS"
              width={200}
              height={65}
              className="h-20 w-auto"
            />
          </div>

          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold mb-2">Đăng nhập</h1>
            <p className="text-muted-foreground">
              Tiếp tục hành trình chinh phục IELTS
            </p>
          </div>

          <LoginForm />
        </div>
      </div>

      {/* Right panel - Scrollable showcase */}
      <div className="hidden lg:flex flex-1 flex-col overflow-y-auto bg-gradient-to-br from-primary/10 via-primary/5 to-blue-50">
        <div className="flex flex-col items-center justify-start min-h-full p-12 gap-8">
          {/* Hero text */}
          <div className="text-center pt-8">
            <h2 className="text-4xl font-bold mb-3 bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
              Chào mừng đến với Moni
            </h2>
            <p className="text-lg text-muted-foreground max-w-sm mx-auto">
              Nền tảng luyện thi IELTS thông minh với AI
            </p>
          </div>

          {/* Feature highlights */}
          <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
            {features.map(({ icon: Icon, label, desc }) => (
              <div
                key={label}
                className="bg-white/70 backdrop-blur-sm rounded-xl p-4 border border-white/50 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-2 mb-1">
                  <div className="p-1.5 bg-primary/10 rounded-lg">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <span className="font-semibold text-sm">{label}</span>
                </div>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>

          {/* Test accounts card */}
          <div className="w-full max-w-sm bg-white/80 backdrop-blur-sm rounded-xl p-5 border border-white/50 shadow-sm">
            <h3 className="font-semibold text-sm mb-3 text-gray-700">
              Tài khoản thử nghiệm
            </h3>
            <div className="space-y-3">
              {testAccounts.map(({ email, password, label }) => (
                <div
                  key={email}
                  className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2"
                >
                  <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded">
                    {label}
                  </span>
                  <div className="text-right">
                    <p className="text-xs font-mono text-gray-700">{email}</p>
                    <p className="text-xs font-mono text-gray-500">{password}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
