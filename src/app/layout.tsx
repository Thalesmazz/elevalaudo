import type { Metadata } from "next";
import { Fira_Code, Fira_Sans } from "next/font/google";
import "./globals.css";

const firaSans = Fira_Sans({
  variable: "--font-fira-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

const firaCode = Fira_Code({
  variable: "--font-fira-code",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
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
      className={`${firaSans.variable} ${firaCode.variable} h-full antialiased`}
    >
      {/* suppressHydrationWarning: extensões de navegador (ex.: ColorZilla
          injeta `cz-shortcut-listen`) mexem no <body> antes do React hidratar,
          gerando um falso mismatch. Suprime só esse ruído de extensão — não
          esconde mismatch real do nosso código. */}
      <body
        className="min-h-full flex flex-col"
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
