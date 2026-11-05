import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
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
          dangerouslySetInnerHTML={{
            __html: `try{const t=localStorage.getItem('keh_theme');if(t==='dark'){document.documentElement.classList.add('dark');}}catch(e){}`,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-[#F9F9F6] text-[#1F2937] dark:bg-[#090D16] dark:text-[#F8FAFC]">
        {children}
      </body>
    </html>
  );
}
