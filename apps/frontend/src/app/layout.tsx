import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import '@/styles/global.css';
import { themeClass } from '@/styles/theme.css';
import { Providers } from './providers';
import { ThemeProvider } from './theme-provider';
import { SessionProvider } from './session-provider';
import { GameProvider } from './game-provider';

export const metadata: Metadata = {
  title: 'Daginz — provably-fair slot (testnet)',
  description: 'Connect your wallet and spin a provably-fair slot on testnet.',
};

// The theme system references these font families by name; load the full set
// once so any theme/font-pair can switch instantly without a network stall.
const FONTS_HREF =
  'https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Cinzel:wght@400;700&family=Fredoka:wght@400;500;600;700&family=JetBrains+Mono:wght@400;700&family=Montserrat:wght@400;600;700&family=Oswald:wght@400;600&family=Rajdhani:wght@500;700&family=Space+Grotesk:wght@400;600&display=swap';

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    // Seed the default theme class so the felt background paints before
    // hydration; ThemeProvider swaps it to the persisted choice on mount.
    <html lang="en" className={themeClass.candy} suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="stylesheet" href={FONTS_HREF} />
      </head>
      <body>
        <Providers>
          <SessionProvider>
            <ThemeProvider>
              <GameProvider>{children}</GameProvider>
            </ThemeProvider>
          </SessionProvider>
        </Providers>
      </body>
    </html>
  );
}
