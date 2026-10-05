import type {Metadata} from 'next';
import './globals.css'; // Global styles

export const metadata: Metadata = {
  title: 'DiretoLink | Aproxime. Conecte. Pronto.',
  description: 'DiretoLink - Um toque conecta o cliente à empresa. Plataforma SaaS moderna de presença digital, aproximação NFC e fidelização de clientes.',
  openGraph: {
    title: 'DiretoLink | Aproxime. Conecte. Pronto.',
    description: 'Um toque conecta o cliente à empresa. Plataforma inteligente de presença física NFC, fidelidade e conexão direta.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DiretoLink | Aproxime. Conecte. Pronto.',
    description: 'Um toque conecta o cliente à empresa. Aproxime. Conecte. Pronto.',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="pt-BR" className="w-full max-w-full overflow-x-hidden">
      <body suppressHydrationWarning className="w-full max-w-full overflow-x-hidden min-h-screen antialiased bg-white text-neutral-900">
        {children}
      </body>
    </html>
  );
}
