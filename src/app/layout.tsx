import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import { ProducerNav } from "@/components/producer-nav";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ElevaLaudo",
  description:
    "Laudo de elevador (PDF) vira dashboard e resumo em português de gente que o síndico entende sozinho.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      {/* suppressHydrationWarning: extensões de navegador (ex.: ColorZilla
          injeta `cz-shortcut-listen`) mexem no <body> antes do React hidratar,
          gerando um falso mismatch. Suprime só esse ruído de extensão — não
          esconde mismatch real do nosso código. */}
      <body
        className="min-h-full flex flex-col"
        suppressHydrationWarning
      >
        <ProducerNav />
        {children}
      </body>
    </html>
  );
}
