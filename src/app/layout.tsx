import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Public Opinion on Gene Editing",
  description: "Webpage for gene editing user input and visualization",
  icons: {
    icon: '/favicon.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <header style={{ display: 'flex', alignItems: 'center', padding: '1rem 0 2rem 0' }}>
          <Link href="/" title="Back to main site">
            <img src="/rc.png" alt="Home" style={{ height: '48px', width: 'auto', borderRadius: '50%' }} />
          </Link>
        </header>
        <main style={{ maxWidth: '900px', margin: '0 auto' }}>{children}</main>
      </body>
    </html>
  );
}
