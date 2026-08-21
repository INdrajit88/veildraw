import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ClientProviders } from '@/components/layout/ClientProviders';
import './globals.css';

// Inter is the open-source SF Pro substitute on non-Apple platforms;
// on macOS/iOS the stack resolves to real SF Pro first (see tailwind.config.ts).
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'VeilDraw — Private Giveaways, Zero-Knowledge Proven',
  description:
    'VeilDraw: privacy-preserving giveaways on Midnight using Zero-Knowledge Proofs. Enter giveaways, prove eligibility, and claim prizes without revealing your identity.',
  icons: { icon: [{ url: '/icon.svg', type: 'image/svg+xml' }] },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body className="antialiased">
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  );
}
