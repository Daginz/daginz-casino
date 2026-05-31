import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Casino (testnet)',
  description: 'Crypto casino on testnet — connect your wallet',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          fontFamily: 'system-ui, sans-serif',
          background: '#0e0e12',
          color: '#f2f2f5',
        }}
      >
        {children}
      </body>
    </html>
  );
}
