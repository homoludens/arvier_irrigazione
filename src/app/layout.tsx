import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Arvier Irrigation',
  description: 'Multi-crop irrigation management for Arvier, Aosta Valley',
  icons: {
    icon: '/arvier_icon.png',
    apple: '/arvier_icon.png',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-slate-100 min-h-screen">{children}</body>
    </html>
  );
}
