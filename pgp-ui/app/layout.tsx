import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import { ClientProviders } from '@/components/layout/ClientProviders';
import './globals.css';

// Inter is the open-source SF Pro substitute on non-Apple platforms;
// on macOS/iOS the stack resolves to real SF Pro first (see tailwind.config.ts).
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://veildraw-pgp-ui.vercel.app'),
  title: {
    default: 'VeilDraw — Private Giveaways, Zero-Knowledge Proven',
    template: '%s · VeilDraw',
  },
  description:
    'VeilDraw: privacy-preserving giveaways on Midnight using Zero-Knowledge Proofs. Enter giveaways, prove eligibility, and claim prizes without revealing your identity.',
  keywords: ['VeilDraw', 'Midnight', 'zero-knowledge', 'private giveaways', 'zk proofs', 'Web3'],
  openGraph: {
    title: 'VeilDraw — Private Giveaways, Zero-Knowledge Proven',
    description:
      'Privacy-preserving giveaways on Midnight. Enter with an opaque commitment, prove eligibility in zero knowledge, and claim prizes without revealing your identity.',
    url: 'https://veildraw-pgp-ui.vercel.app',
    siteName: 'VeilDraw',
    locale: 'en_US',
    type: 'website',
    images: [
      {
        url: '/logo.png',
        width: 512,
        height: 512,
        alt: 'VeilDraw',
      },
    ],
  },
  twitter: {
    card: 'summary',
    title: 'VeilDraw — Private Giveaways, Zero-Knowledge Proven',
    description:
      'Privacy-preserving giveaways on Midnight. Zero-knowledge entry, proof-based claims, no identity disclosure.',
    images: ['/logo.png'],
  },
  icons: {
    icon: [
      { url: '/logo.png', type: 'image/png' },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    apple: [{ url: '/logo.png', type: 'image/png' }],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`} suppressHydrationWarning>
      <body className="antialiased">
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  );
}
