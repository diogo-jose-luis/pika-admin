import { Inter } from "next/font/google";
import type { Metadata } from "next";
import Script from "next/script";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import "@/lib/fontawesome";
import "./globals.css";
import { THEME_STORAGE_KEY } from "@/lib/storage-keys";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Pika · Painel administrativo",
  description: "Gestão de corridas, motoristas e passageiros Pika.",
  icons: {
    icon: [{ url: "/pika.png", type: "image/png" }],
    shortcut: "/pika.png",
    apple: "/pika.png",
  },
};

const themeInitScript = `(function(){try{var k=${JSON.stringify(THEME_STORAGE_KEY)};var t=localStorage.getItem(k);if(t==="dark"||(!t&&window.matchMedia("(prefers-color-scheme: dark)").matches))document.documentElement.classList.add("dark");}catch(e){}})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt" className={`${inter.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="min-h-full font-sans">
        <Script id="pika-theme-init" strategy="beforeInteractive">
          {themeInitScript}
        </Script>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
