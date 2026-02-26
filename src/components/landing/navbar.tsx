"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useAuthStore } from '@/store/auth-store';
import { UserAvatarDropdown } from '@/components/layout/user-avatar-dropdown';

const navLinks = [
  { label: "Trang chủ", href: "/" },
  { label: "Luyện Tập", href: "/practice" },
  { label: "Từ vựng", href: "/vocabulary" },
  { label: "Liên Hệ", href: "#contact" },
]

export function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/95 backdrop-blur-md border-b shadow-sm"
          : "bg-transparent"
      }`}
    >
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/">
          <Image
            src="/logo.png"
            alt="Moni"
            width={100}
            height={40}
            className={`object-contain transition-all duration-300 ${
              scrolled ? "" : "brightness-0 invert"
            }`}
          />
        </Link>

        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className={`text-sm font-medium transition-colors hover:text-primary ${
                scrolled ? "text-gray-700" : "text-white"
              }`}
            >
              {link.label}
            </a>
          ))}
        </div>

        {isAuthenticated ? (
          <UserAvatarDropdown variant={scrolled ? 'light' : 'dark'} />
        ) : (
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              asChild
              className={scrolled ? "" : "text-white hover:bg-white/20"}
            >
              <Link href="/login">Đăng nhập</Link>
            </Button>
            <Button
              asChild
              className={
                scrolled
                  ? ""
                  : "bg-white text-black hover:bg-gray-100"
              }
            >
              <Link href="/register">Bắt đầu ngay</Link>
            </Button>
          </div>
        )}
      </div>
    </nav>
  )
}
