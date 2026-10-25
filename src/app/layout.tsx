import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "ANBA Stats Lab — Comparador Estadístico ANBA vs NBA Real",
  description:
    "Plataforma de análisis estadístico avanzado para comparar el rendimiento de jugadores y franquicias en ANBA (anba2k.es) frente a la NBA real.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="dark" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased bg-zinc-50 dark:bg-[#09090B] text-zinc-900 dark:text-zinc-100 min-h-screen selection:bg-emerald-500/20 selection:text-emerald-400`}
      >
        {children}
      </body>
    </html>
  );
}
