import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';

export const metadata: Metadata = {
  title: 'Companion — Someone who remembers you',
  description:
    'Create an AI companion that feels alive: long-term memory, proactive holiday messages, voice, and emotional presence.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="nav">
          <Link href="/" className="logo">
            Companion
          </Link>
          <nav className="row" style={{ gap: 16 }}>
            <Link href="/create">Create</Link>
            <Link href="/chat">Chat</Link>
            <Link href="/login">Sign in</Link>
          </nav>
        </header>
        {children}
      </body>
    </html>
  );
}
