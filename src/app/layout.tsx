import type { Metadata, Viewport } from "next";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: "Oskar – OIXIO Digital koolitusabiline",
  description: "Oskar vastab küsimustele OIXIO Digitali AI, Microsoft 365 Copiloti ja Power BI koolituste kohta.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#7c3aed",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="et">
      <body className="flex h-dvh flex-col">
        {children}
        <footer className="shrink-0 border-t border-zinc-200 bg-white px-4 pb-[max(0.375rem,env(safe-area-inset-bottom))] pt-1.5 text-center text-xs text-zinc-400">
          © 2026 OIXIO Digital AS. Built with Claude Code
        </footer>
        <Toaster position="top-center" richColors closeButton />
      </body>
    </html>
  );
}
