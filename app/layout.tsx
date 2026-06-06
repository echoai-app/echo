import type { Metadata } from 'next';
import './globals.css';
import Providers from './providers';

export const metadata: Metadata = {
  title: 'Echo — a reflection companion',
  description:
    'Echo is a calm, voice-first emotional reflection companion that remembers what matters. Powered by Mnemos memory on Walrus, keyed to your Sui identity.',
};

// Silences the noisy "Cannot redefine property: ethereum" error thrown when
// multiple crypto-wallet browser extensions fight over window.ethereum. Not an
// Echo error — this just keeps the dev overlay quiet.
const SUPPRESS_WALLET_ERROR = `(function(){
  function isWalletClash(m){return typeof m==='string'&&m.indexOf('Cannot redefine property: ethereum')!==-1;}
  window.addEventListener('error',function(e){if(e&&isWalletClash(e.message)){e.stopImmediatePropagation();e.preventDefault();}},true);
  window.addEventListener('unhandledrejection',function(e){var r=e&&e.reason;var m=r&&(r.message||r);if(isWalletClash(m)){e.stopImmediatePropagation();e.preventDefault();}},true);
})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@500;600;700;800&family=Nunito:ital,wght@0,400;0,600;0,700;0,800;1,400;1,600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <script dangerouslySetInnerHTML={{ __html: SUPPRESS_WALLET_ERROR }} />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
