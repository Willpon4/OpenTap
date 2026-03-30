import '@/styles/globals.css';
import Header from '@/components/Header';

export const metadata = {
  title: 'OpenTap — Public Water Access Accountability',
  description: 'Report, track, and fix broken public water fountains. Free, open-source, no ads.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
          crossOrigin=""
        />
      </head>
      <body>
        <Header />
        <main style={{ marginTop: 'var(--header-height)' }}>
          {children}
        </main>
      </body>
    </html>
  );
}
