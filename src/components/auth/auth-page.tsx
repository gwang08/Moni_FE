'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { LoginForm } from './login-form';
import { RegisterForm } from './register-form';

interface AuthPageProps {
  initialMode?: 'login' | 'register';
}

export function AuthPage({ initialMode = 'login' }: AuthPageProps) {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const isRegister = mode === 'register';

  const toggle = () => {
    const next = mode === 'login' ? 'register' : 'login';
    setMode(next);
    window.history.replaceState(null, '', `/${next}`);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-4">
      {/* Top bar: back link + logo */}
      <div className="w-full max-w-[920px] flex items-center justify-between mb-4 z-10">
        <Link href="/" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Trang chủ
        </Link>
      
      </div>

      {/* Desktop card with sliding panels */}
      <div className="relative w-full max-w-[920px] h-[620px] rounded-3xl overflow-hidden bg-white shadow-2xl shadow-black/8 z-10 hidden lg:block">
        {/* Login form — left half */}
        <div
          className={`absolute inset-y-0 left-0 w-1/2 flex items-center justify-center p-10 transition-all duration-500 ease-in-out ${
            isRegister ? 'opacity-0 pointer-events-none' : 'opacity-100'
          }`}
        >
          <div className="w-full max-w-[340px]">
            <LoginForm />
          </div>
        </div>

        {/* Register form — right half */}
        <div
          className={`absolute inset-y-0 right-0 w-1/2 flex items-center justify-center px-8 py-6 transition-all duration-500 ease-in-out ${
            isRegister ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          <div className="w-full max-w-[340px]">
            <RegisterForm />
          </div>
        </div>

        {/* Sliding image panel — panoramic crop */}
        <div
          className={`absolute inset-y-0 left-0 w-1/2 z-20 overflow-hidden transition-transform duration-700 ease-in-out ${
            isRegister ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          {/* Image 200% width — slides to show left/right half */}
          <div
            className={`absolute inset-y-0 left-0 w-[200%] transition-transform duration-700 ease-in-out ${
              isRegister ? 'translate-x-0' : '-translate-x-1/2'
            }`}
          >
            <Image src="/login.png" alt="" fill className="object-cover" priority />
            <div className="absolute inset-0 bg-gradient-to-br from-teal-700/80 via-teal-600/70 to-emerald-700/75" />
          </div>

          {/* Overlay text + toggle button */}
          <div className="relative z-10 flex flex-col items-center justify-center h-full text-white text-center px-10">
            <h2 className="text-3xl font-bold mb-3">
              {isRegister ? 'Chào mừng trở lại!' : 'Xin chào!'}
            </h2>
            <p className="text-white/80 mb-8 text-sm leading-relaxed max-w-[260px]">
              {isRegister
                ? 'Đăng nhập để tiếp tục hành trình chinh phục IELTS'
                : 'Đăng ký tài khoản để bắt đầu luyện thi IELTS cùng Moni'}
            </p>
            <button
              type="button"
              onClick={toggle}
              className="px-10 py-2.5 border-2 border-white/80 rounded-full text-sm font-semibold tracking-wider hover:bg-white/20 transition-colors cursor-pointer"
            >
              {isRegister ? 'ĐĂNG NHẬP' : 'ĐĂNG KÝ'}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile card — single column with tabs */}
      <div className="w-full max-w-md z-10 lg:hidden">
        <div className="bg-white rounded-2xl p-6 shadow-xl">
          <div className="flex mb-6 bg-gray-100 rounded-lg p-1">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                window.history.replaceState(null, '', '/login');
              }}
              className={`flex-1 py-2.5 text-sm font-medium rounded-md transition-colors cursor-pointer ${
                !isRegister ? 'bg-primary text-white shadow-sm' : 'text-gray-500'
              }`}
            >
              Đăng nhập
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                window.history.replaceState(null, '', '/register');
              }}
              className={`flex-1 py-2.5 text-sm font-medium rounded-md transition-colors cursor-pointer ${
                isRegister ? 'bg-primary text-white shadow-sm' : 'text-gray-500'
              }`}
            >
              Đăng ký
            </button>
          </div>
          {mode === 'login' ? <LoginForm /> : <RegisterForm />}
        </div>
      </div>
    </div>
  );
}
