import type { Metadata } from "next";
import { Inter, Manrope } from "next/font/google";
import "./globals.css";
import { AppFooter } from "../components/layout/AppFooter";
import { UserSettingsProvider } from "../components/providers/UserSettingsProvider";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "AI Health Guide - Clinical Serenity",
  description: "AI-powered medical recommendation and symptom checker application.",
  icons: {
    icon: [
      { url: "/icon.png?v=3", type: "image/png" },
      { url: "/favicon.png?v=3", type: "image/png" },
    ],
    shortcut: "/favicon.png?v=3",
    apple: "/favicon.png?v=3",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${manrope.variable} h-full`}
    >
      <body className="min-h-full flex flex-col font-sans bg-surface text-on-surface">
        <UserSettingsProvider>
          {children}
          <AppFooter />
        </UserSettingsProvider>
      </body>
    </html>
  );
}
