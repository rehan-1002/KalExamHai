import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import { MiniRobotCompanion } from "@/components/ui/mini-robot-companion";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://kalexamhai-one.vercel.app";

export const viewport: Viewport = {
  themeColor: "#2563EB",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: "KalExamHai — AI Exam Prep & Paper Generator for Mumbai University",
    template: "%s | KalExamHai",
  },
  description:
    "Turn your college notes and syllabus into strict NEP-2020 format question papers, 3D memory flashcards, and viva prep in 60 seconds.",
  applicationName: "KalExamHai",
  authors: [{ name: "KalExamHai Team" }],
  keywords: [
    "Mumbai University",
    "MU engineering",
    "question paper generator",
    "NEP-2020",
    "IAT paper",
    "End-Sem paper",
    "exam prep",
    "engineering flashcards",
    "viva prep",
    "exam survival kit",
  ],
  icons: {
    icon: "/keh-logo.svg",
    apple: "/keh-logo.svg",
  },
  manifest: "/manifest.webmanifest",
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: APP_URL,
    siteName: "KalExamHai",
    title: "KalExamHai — AI Exam Prep & Paper Generator for Mumbai University",
    description:
      "Turn your college notes and syllabus into strict NEP-2020 format question papers, 3D memory flashcards, and viva prep in 60 seconds.",
  },
  twitter: {
    card: "summary_large_image",
    title: "KalExamHai — AI Exam Prep & Paper Generator for Mumbai University",
    description:
      "Turn your college notes and syllabus into strict NEP-2020 format question papers, 3D memory flashcards, and viva prep in 60 seconds.",
  },
  verification: {
    google: "nzH6weSRvKqaw67qRPwc6Tq_QlEmMR0fGxxYQujcVbg",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebApplication",
      "@id": `${APP_URL}/#app`,
      "name": "KalExamHai",
      "url": APP_URL,
      "applicationCategory": "EducationalApplication",
      "operatingSystem": "All",
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "INR",
      },
      "description":
        "AI-powered exam preparation platform for Mumbai University (NEP-2020). Generate 60-mark papers, 20-mark IAT tests, 3D holographic flashcards, and last-minute survival kits.",
      "audience": {
        "@type": "EducationalAudience",
        "educationalRole": "student",
      },
    },
    {
      "@type": "EducationalOrganization",
      "@id": `${APP_URL}/#org`,
      "name": "KalExamHai",
      "url": APP_URL,
      "logo": `${APP_URL}/keh-logo.svg`,
      "description": "Mumbai University (NEP-2020) Engineering AI Exam Preparation System",
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} h-full antialiased`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `try{const p=window.location.pathname;const isPublic=p==='/'||p.startsWith('/login')||p.startsWith('/signup');if(!isPublic&&localStorage.getItem('keh_theme')==='dark'){document.documentElement.classList.add('dark');}else if(isPublic){document.documentElement.classList.remove('dark');}}catch(e){}`,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-[#F9F9F6] text-[#1F2937] dark:bg-[#090D16] dark:text-[#F8FAFC]">
        {children}
        <Analytics />
        <MiniRobotCompanion />
      </body>
    </html>
  );
}
