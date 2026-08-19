import { Inter } from "next/font/google";
import type { Metadata } from "next";
import Script from "next/script";
import { AuthProvider } from "@/context/AuthContext";
import { LocaleProvider } from "@/components/providers/LocaleProvider";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import "@/lib/fontawesome";
import "./globals.css";
import { LOCALE_STORAGE_KEY, THEME_STORAGE_KEY } from "@/lib/storage-keys";

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

const localeInitScript = `(function(){try{var k=${JSON.stringify(LOCALE_STORAGE_KEY)};var l=localStorage.getItem(k);if(l==="en")document.documentElement.lang="en";}catch(e){}})();`;

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
        <Script id="pika-locale-init" strategy="beforeInteractive">
          {localeInitScript}
        </Script>
        <ThemeProvider>
          <LocaleProvider>
            <AuthProvider>{children}</AuthProvider>
          </LocaleProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
