import type {Metadata} from 'next';
import './globals.css'; // Global styles
import '@/lib/suppress-firestore-logs';

export const metadata: Metadata = {
  metadataBase: new URL('https://diretolink.com.br'),
  title: 'DiretoLink | Seu negócio inteiro em um só link',
  description:
    'Reúna WhatsApp, cardápio, agendamento, catálogo, avaliações, redes sociais e muito mais em uma única página profissional para o seu negócio.',
  alternates: {
    canonical: 'https://diretolink.com.br/',
  },
  openGraph: {
    title: 'DiretoLink | Seu negócio inteiro em um só link',
    description:
      'Reúna WhatsApp, cardápio, agendamento, catálogo, avaliações, redes sociais e muito mais em uma única página profissional para o seu negócio.',
    url: 'https://diretolink.com.br/',
    siteName: 'DiretoLink',
    locale: 'pt_BR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DiretoLink | Seu negócio inteiro em um só link',
    description:
      'Reúna WhatsApp, cardápio, agendamento, catálogo, avaliações, redes sociais e muito mais em uma única página profissional para o seu negócio.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning className="w-full max-w-full overflow-x-hidden">
      <body suppressHydrationWarning className="w-full max-w-full overflow-x-hidden min-h-screen antialiased bg-white text-neutral-900">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebApplication',
              name: 'DiretoLink',
              url: 'https://diretolink.com.br/',
              applicationCategory: 'BusinessApplication',
              operatingSystem: 'All',
              description:
                'Reúna WhatsApp, cardápio, agendamento, catálogo, avaliações, redes sociais e muito mais em uma única página profissional para o seu negócio.',
              inLanguage: 'pt-BR',
              offers: [
                {
                  '@type': 'Offer',
                  name: 'DiretoLink Links',
                  price: '29.99',
                  priceCurrency: 'BRL',
                },
                {
                  '@type': 'Offer',
                  name: 'DiretoLink Pro',
                  price: '69.99',
                  priceCurrency: 'BRL',
                },
              ],
            }),
          }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                function isIgnorable(err) {
                  if (!err) return true;
                  if (typeof Event !== 'undefined' && err instanceof Event) return true;
                  if (typeof err === 'object' && err !== null) {
                    if (err.isTrusted === true && !err.message && !err.stack) return true;
                    var msg = String(err.message || (err.reason && err.reason.message) || err || '');
                    if (
                      msg.indexOf('webpack-hmr') !== -1 ||
                      msg.indexOf('WebSocket') !== -1 ||
                      msg.indexOf('Disconnecting idle stream') !== -1 ||
                      msg.indexOf('Timed out waiting for new targets') !== -1
                    ) {
                      return true;
                    }
                  }
                  return false;
                }

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

                window.addEventListener('error', function(e) {
                  var err = e.error || e;
                  if (isIgnorable(err)) {
                    e.preventDefault();
                    if (e.stopImmediatePropagation) e.stopImmediatePropagation();
                    return;
                  }
                  handleChunkError(e);
                }, true);

                window.addEventListener('unhandledrejection', function(e) {
                  var reason = e.reason;
                  if (isIgnorable(reason)) {
                    e.preventDefault();
                    if (e.stopImmediatePropagation) e.stopImmediatePropagation();
                    return;
                  }
                  handleChunkError(e);
                }, true);
              })();
            `,
          }}
        />
        {children}
      </body>
    </html>
  );
}
