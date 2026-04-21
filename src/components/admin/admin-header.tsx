'use client';

interface AdminHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}

export function AdminHeader({ title, description, actions }: AdminHeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-gray-100 bg-white/95 px-6 backdrop-blur-sm h-14">
      <div>
        <h1 className="text-[15px] font-bold text-gray-800 tracking-tight">{title}</h1>
        {description && <p className="text-[11px] text-gray-400 mt-0.5">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </header>
  );
}
