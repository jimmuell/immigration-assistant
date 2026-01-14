import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Toaster } from "@/components/ui/sonner";
import { ClientLayout } from "@/components/client-layout";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "LinkToLawyers - Connect with Qualified Immigration Attorneys",
  description: "Find experienced immigration attorneys and get free quotes. LinkToLawyers connects clients with qualified lawyers for expert legal guidance.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Prevent iOS from auto-detecting and converting phone numbers, dates, emails to links */}
        <meta name="format-detection" content="telephone=no, date=no, email=no, address=no" />
        {/* Enable safe area inset support for iOS devices with notches/home indicators */}
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <Providers>
          <ClientLayout>
            {children}
          </ClientLayout>
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
