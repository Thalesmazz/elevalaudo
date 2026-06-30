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
      suppressHydrationWarning
    >
      {/* suppressHydrationWarning: extensões de navegador (ex.: ColorZilla
          injeta `cz-shortcut-listen`) mexem no <body> antes do React hidratar,
          gerando um falso mismatch. No <html> é por causa do script de tema
          abaixo, que adiciona/remove `.dark` antes do React hidratar. Suprime só
          esse ruído — não esconde mismatch real do nosso código. */}
      <body
        className="min-h-full flex flex-col"
        suppressHydrationWarning
      >
        {/* Tema (claro/escuro): aplica a classe ANTES da pintura pra não piscar.
            Escolha explícita persiste em localStorage; sem escolha, segue o
            sistema. Roda como 1º filho do body (síncrono, pré-render). */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var e=localStorage.getItem('el-theme');var d=e?e==='dark':window.matchMedia('(prefers-color-scheme: dark)').matches;var c=document.documentElement.classList;d?c.add('dark'):c.remove('dark');}catch(_){}})();`,
          }}
        />
        {children}
      </body>
    </html>
  );
}
