import Link from 'next/link';

export default function Home() {
  return (
    <main style={{ fontFamily: 'system-ui', maxWidth: 720, margin: '0 auto', padding: 24 }}>
      <h1>AI Companions</h1>
      <p>Create your own AI companion or chat with one someone else made.</p>
      <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
        <Link href="/create" style={{ padding: '10px 16px', background: '#111', color: '#fff', borderRadius: 8 }}>
          Create a companion
        </Link>
        <Link href="/chat" style={{ padding: '10px 16px', border: '1px solid #111', borderRadius: 8 }}>
          Start chatting
        </Link>
      </div>
    </main>
  );
}