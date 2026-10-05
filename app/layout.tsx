import type {Metadata} from 'next';
import './globals.css'; // Global styles

export const metadata: Metadata = {
  title: 'DiretoLink | Tudo do seu negócio em um só lugar',
  description: 'DiretoLink - Crie uma experiência digital completa para seus clientes. Reúna serviços, produtos, agendamentos, avaliações, fidelidade e WhatsApp em um único link. Compartilhe por link, QR Code ou NFC.',
  openGraph: {
    title: 'DiretoLink | Tudo do seu negócio em um só lugar',
    description: 'Um link. Várias possibilidades. Reúna serviços, produtos, agendamentos, avaliações, fidelidade e WhatsApp em um único link compartilhado por bio, QR Code ou NFC.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DiretoLink | Tudo do seu negócio em um só lugar',
    description: 'Um link. Várias possibilidades. Conecte clientes a tudo do seu negócio.',
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
