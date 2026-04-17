"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useAuthStore } from "@/store/auth-store"
import { UserAvatarDropdown } from "@/components/layout/user-avatar-dropdown"

const navLinks = [
  { label: "Trang chủ", href: "/" },
  { label: "Luyện Tập", href: "/practice" },
  { label: "Từ vựng", href: "/vocabulary" },
]

export function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const { isAuthenticated } = useAuthStore()

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
          : "bg-white/80 backdrop-blur-sm"
      }`}
    >
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/">
          <Image
            src="/Moni-logo.png"
            alt="Moni"
            width={120}
            height={48}
            className="object-contain"
          />
        </Link>

        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-sm font-medium text-gray-700 transition-colors hover:text-primary"
            >
              {link.label}
            </a>
          ))}
        </div>

        {isAuthenticated ? (
          <UserAvatarDropdown variant="light" />
        ) : (
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              asChild
              className="rounded-full text-gray-700 hover:text-primary"
            >
              <Link href="/login">Đăng nhập</Link>
            </Button>
            <Button asChild className="rounded-full">
              <Link href="/register">Bắt đầu ngay</Link>
            </Button>
          </div>
        )}
      </div>
    </nav>
  )
}
