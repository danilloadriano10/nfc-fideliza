import type {Metadata} from 'next';
import './globals.css'; // Global styles

export const metadata: Metadata = {
  title: 'NFC Fideliza - Plataforma Multiempresa NFC & Fidelidade',
  description: 'Plataforma multiempresa de cartões NFC para estabelecimentos locais com página pública dinâmica, fidelidade inteligente, modo caixa e gestão completa.',
  openGraph: {
    title: 'NFC Fideliza - Plataforma Multiempresa NFC & Fidelidade',
    description: 'Plataforma multiempresa de cartões NFC para estabelecimentos locais com página pública dinâmica, fidelidade inteligente, modo caixa e gestão completa.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NFC Fideliza - Plataforma Multiempresa NFC & Fidelidade',
    description: 'Plataforma multiempresa de cartões NFC para estabelecimentos locais com página pública dinâmica, fidelidade inteligente, modo caixa e gestão completa.',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
