'use client';

interface AdminHeaderProps {
  title: string;
}

export function AdminHeader({ title }: AdminHeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex h-[52px] items-center border-b border-gray-100 bg-white/95 px-6 backdrop-blur-sm">
      <h1 className="text-[14px] font-semibold text-gray-700 tracking-tight">{title}</h1>
    </header>
  );
}
