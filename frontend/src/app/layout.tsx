import type { Metadata, Viewport } from 'next';
import { Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const sansFont = Plus_Jakarta_Sans({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans',
  weight: ['400', '500', '600', '700'],
});

const monoFont = JetBrains_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-mono',
  weight: ['400', '500'],
});

export const metadata: Metadata = {
  title: 'Mirror Check — Check your blind spot before you switch lanes',
  description:
    'An AI thinking companion that helps you examine your doubt about learning a skill. Mirror Check surfaces hidden assumptions and asks non-judgmental Socratic questions.',
  keywords: ['Mirror Check', 'Socratic thinking', 'learning decisions', 'skill evaluation', 'assumptions examination'],
  authors: [{ name: 'Mirror Check' }],
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#080c14',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${sansFont.variable} ${monoFont.variable} dark`}>
      <body className="font-sans bg-[#080c14] text-slate-100 min-h-screen selection:bg-sky-500/30 selection:text-sky-200">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-sky-600 focus:text-white focus:rounded-lg focus:shadow-lg focus:outline-none"
        >
          Skip to main content
        </a>
        <div className="relative min-h-screen flex flex-col overflow-x-hidden">
          {/* Ambient background glow */}
          <div
            className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(56,189,248,0.12),rgba(255,255,255,0))]"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(ellipse_60%_50%_at_80%_100%,rgba(99,102,241,0.08),rgba(255,255,255,0))]"
            aria-hidden="true"
          />
          <div className="relative z-10 flex-1 flex flex-col">
            {children}
          </div>
        </div>
      </body>
    </html>
  );
}
