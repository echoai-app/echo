import type { Metadata } from 'next';
import { Baloo_2, Nunito } from 'next/font/google';
import './globals.css';
import Providers from './providers';

// Display + body type, self-hosted via next/font (no layout shift, no extra <link>).
const baloo = Baloo_2({ subsets: ['latin'], weight: ['500', '600', '700', '800'], variable: '--font-display' });
const nunito = Nunito({ subsets: ['latin'], weight: ['400', '600', '700', '800'], style: ['normal', 'italic'], variable: '--font-body' });

export const metadata: Metadata = {
  title: 'Echo - Your AI Companion',
  description: 'A calm space to reflect — and be remembered.',
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
    <html lang="en" className={`${baloo.variable} ${nunito.variable} h-full`} suppressHydrationWarning>
      <body>
        <script dangerouslySetInnerHTML={{ __html: SUPPRESS_WALLET_ERROR }} />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
