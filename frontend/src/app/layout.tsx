import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Route 53 — AWS Management Console',
  description: 'Amazon Route 53 is a highly available and scalable cloud Domain Name System (DNS) web service.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
