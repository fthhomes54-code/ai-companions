'use client';

import { useEffect, useState } from 'react';

type Msg = { role: 'user' | 'assistant'; content: string };

export default function ChatPage() {
  const [companion, setCompanion] = useState<any>(null);
  const [history, setHistory] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('currentCompanion');
    if (saved) setCompanion(JSON.parse(saved));
  }, []);

  async function send() {
    if (!input.trim() || !companion) return;
    const userMsg = input.trim();
    setInput('');
    const newHistory = [...history, { role: 'user', content: userMsg }];
    setHistory(newHistory);
    setLoading(true);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companion, history, message: userMsg }),
      });
      const data = await res.json();
      setHistory([...newHistory, { role: 'assistant', content: data.reply }]);
    } catch (e) {
      setHistory([...newHistory, { role: 'assistant', content: 'Sorry, something broke.' }]);
    } finally {
      setLoading(false);
    }
  }

  if (!companion) {
    return <main style={{ fontFamily: 'system-ui', padding: 24 }}>No companion yet. <a href="/create">Create one</a>.</main>;
  }

  return (
    <main style={{ fontFamily: 'system-ui', maxWidth: 640, margin: '0 auto', padding: 24 }}>
      <h2>Chatting with {companion.name}</h2>
      <div style={{ border: '1px solid #ddd', borderRadius: 8, padding: 12, minHeight: 300, marginBottom: 12 }}>
        {history.map((m, i) => (
          <div key={i} style={{ marginBottom: 8, textAlign: m.role === 'user' ? 'right' : 'left' }}>
            <b>{m.role === 'user' ? 'You' : companion.name}:</b> {m.content}
          </div>
        ))}
        {loading && <div>…</div>}
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && send()}
          placeholder="Say something..."
          style={{ flex: 1, padding: 10 }}
        />
        <button onClick={send} disabled={loading} style={{ padding: '10px 16px' }}>Send</button>
      </div>
    </main>
  );
}