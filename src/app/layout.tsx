import type { Metadata } from "next";
import { Geist, Geist_Mono, Sora } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const sora = Sora({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Chronos Wealth",
  description: "Asset and income simulation for long-term wealth planning",
};

import { StatusProvider } from "@/components/providers/StatusProvider";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(() => {
  const savedTheme = localStorage.getItem("chronos-theme");
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const nextIsDark = savedTheme ? savedTheme === "dark" : prefersDark;
  document.documentElement.classList.toggle("dark", nextIsDark);
})();`,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${sora.variable} antialiased`}
      >
        <StatusProvider>
          {children}
        </StatusProvider>
      </body>
    </html>
  );
}
