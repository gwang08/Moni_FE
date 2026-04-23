import type { Metadata } from "next";
import { Geist, Geist_Mono, Spectral } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { QueryProvider } from "@/components/providers/query-provider";
import { SessionAuthGuard } from "@/components/auth/session-auth-guard";
import { SessionExpiredDialog } from "@/components/auth/session-expired-dialog";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const spectral = Spectral({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-serif",
});

export const metadata: Metadata = {
  title: "Moni - Nền tảng giáo dục",
  description: "Moni - Preschool, Du học & IELTS. Nâng tầm giáo dục cho tương lai.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        suppressHydrationWarning
        className={`${geistSans.variable} ${geistMono.variable} ${spectral.variable} antialiased`}
      >
        <QueryProvider>
          <SessionAuthGuard />
          <SessionExpiredDialog />
          {children}
        </QueryProvider>
        <Toaster />
      </body>
    </html>
  );
}
