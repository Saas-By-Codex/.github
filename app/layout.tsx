import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Stripe Recovery SaaS',
  description: 'Recover failed Stripe payments with smart dunning.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
