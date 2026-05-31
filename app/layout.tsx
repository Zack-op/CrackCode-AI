import { Toaster } from "sonner";
import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";

import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "CrackCode AI — AI Recruitment Intelligence Platform",
    template: "%s | CrackCode AI",
  },
  description:
    "CrackCode AI is an AI-powered recruitment intelligence platform featuring real-time voice interviews, multi-mode evaluation, DSA challenges, system design rounds, and deep analytics — built to help you land your dream role.",
  keywords: [
    "AI mock interview",
    "technical interview prep",
    "DSA interview",
    "system design interview",
    "FAANG preparation",
    "voice interview simulator",
    "coding interview workspace",
    "AI recruitment platform",
  ],
  authors: [{ name: "CrackCode AI" }],
  creator: "CrackCode AI",
  openGraph: {
    type: "website",
    locale: "en_US",
    title: "CrackCode AI — AI Recruitment Intelligence Platform",
    description:
      "Real-time AI interviews, voice simulation, 10-dimension evaluation, and analytics. Crack your next technical interview.",
    siteName: "CrackCode AI",
  },
  twitter: {
    card: "summary_large_image",
    title: "CrackCode AI",
    description: "AI-powered interview intelligence. Prepare smarter. Land faster.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="dark">
      <body className={`${dmSans.variable} font-sans antialiased`}>
        {children}
        <Toaster
          theme="dark"
          position="bottom-right"
          toastOptions={{
            style: {
              background: "#111424",
              border: "1px solid rgba(93,142,255,0.2)",
              color: "#E0E9FF",
            },
          }}
        />
      </body>
    </html>
  );
}
