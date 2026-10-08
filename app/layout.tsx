import type {Metadata} from 'next';
import './globals.css'; // Global styles
import '@/lib/suppress-firestore-logs';

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
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                function handleChunkError(err) {
                  try {
                    var msg = (err && (err.message || (err.reason && err.reason.message))) || '';
                    var name = (err && (err.name || (err.reason && err.reason.name))) || '';
                    if (name === 'ChunkLoadError' || msg.indexOf('ChunkLoadError') !== -1 || msg.indexOf('Loading chunk') !== -1) {
                      var key = '_chunk_retry_ts';
                      var last = sessionStorage.getItem(key);
                      var now = Date.now();
                      if (!last || now - parseInt(last, 10) > 8000) {
                        sessionStorage.setItem(key, String(now));
                        window.location.reload();
                      }
                    }
                  } catch (e) {}
                }
                window.addEventListener('error', handleChunkError);
                window.addEventListener('unhandledrejection', handleChunkError);
              })();
            `,
          }}
        />
      </head>
      <body suppressHydrationWarning className="w-full max-w-full overflow-x-hidden min-h-screen antialiased bg-white text-neutral-900">
        {children}
      </body>
    </html>
  );
}
