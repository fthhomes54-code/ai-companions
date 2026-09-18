'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

type Msg = {
  role: 'user' | 'assistant';
  content: string;
  modality?: 'text' | 'voice' | 'image';
  mediaUrl?: string | null;
};

type Companion = {
  id?: string;
  name: string;
  age?: number | null;
  personality?: string;
  backstory?: string;
  tone?: string;
  exampleLines?: string;
  voiceStyle?: string;
  system_prompt?: string;
};

function ChatInner() {
  const searchParams = useSearchParams();
  const companionIdParam = searchParams.get('id');

  const [companion, setCompanion] = useState<Companion | null>(null);
  const [companionId, setCompanionId] = useState<string | null>(null);
  const [history, setHistory] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [recording, setRecording] = useState(false);
  const [imageEnabled, setImageEnabled] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setImageEnabled(process.env.NEXT_PUBLIC_ENABLE_IMAGE_GEN === 'true');
  }, []);

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: 'smooth' });
  }, [history, loading]);

  const loadMessages = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/companions/${id}/messages`);
      if (!res.ok) return;
      const data = await res.json();
      const msgs: Msg[] = (data.messages || [])
        .filter((m: { role: string }) => m.role === 'user' || m.role === 'assistant')
        .map((m: { role: 'user' | 'assistant'; content: string; modality?: Msg['modality']; media_url?: string }) => ({
          role: m.role,
          content: m.content,
          modality: m.modality,
          mediaUrl: m.media_url,
        }));
      setHistory(msgs);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    async function init() {
      const id = companionIdParam || localStorage.getItem('currentCompanionId');
      const saved = localStorage.getItem('currentCompanion');

      if (id && id !== 'local') {
        setCompanionId(id);
        // Try list companions for full row
        try {
          const res = await fetch('/api/companions');
          if (res.ok) {
            const data = await res.json();
            const found = (data.companions || []).find((c: { id: string }) => c.id === id);
            if (found) {
              setCompanion({
                id: found.id,
                name: found.name,
                age: found.age,
                personality: found.personality,
                backstory: found.backstory,
                tone: found.tone,
                exampleLines: found.example_lines,
                voiceStyle: found.voice_style,
                system_prompt: found.system_prompt,
              });
              await loadMessages(id);
              return;
            }
          }
        } catch {
          // fall through
        }
      }

      if (saved) {
        const c = JSON.parse(saved) as Companion;
        setCompanion(c);
        if (c.id && c.id !== 'local') {
          setCompanionId(c.id);
          await loadMessages(c.id);
        }
      }
    }
    init();
  }, [companionIdParam, loadMessages]);

  async function speak(text: string) {
    try {
      const res = await fetch('/api/voice/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) return;
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      await audio.play();
    } catch {
      // TTS optional
    }
  }

  async function send(text?: string, modality: 'text' | 'voice' = 'text') {
    const userMsg = (text ?? input).trim();
    if (!userMsg || !companion) return;
    setInput('');
    setError(null);
    const newHistory = [...history, { role: 'user' as const, content: userMsg, modality }];
    setHistory(newHistory);
    setLoading(true);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companionId: companionId && companionId !== 'local' ? companionId : undefined,
          companion,
          history,
          message: userMsg,
          modality,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Chat failed');
      const reply = data.reply as string;
      setHistory([...newHistory, { role: 'assistant', content: reply, modality: 'text' }]);
      if (modality === 'voice') {
        void speak(reply);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Sorry, something broke.';
      setError(msg);
      setHistory([...newHistory, { role: 'assistant', content: msg }]);
    } finally {
      setLoading(false);
    }
  }

  async function startRecording() {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const form = new FormData();
        form.append('audio', blob, 'voice.webm');
        setLoading(true);
        try {
          const res = await fetch('/api/voice/stt', { method: 'POST', body: form });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || 'STT failed');
          await send(data.text, 'voice');
        } catch (e) {
          setError(e instanceof Error ? e.message : 'Voice failed');
          setLoading(false);
        }
      };
      mediaRecorderRef.current = recorder;
      recorder.start();
      setRecording(true);
    } catch {
      setError('Microphone permission denied or unavailable.');
    }
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop();
    setRecording(false);
  }

  async function requestPhoto() {
    if (!companion) return;
    setLoading(true);
    setError(null);
    try {
      const prompt = `Portrait of ${companion.name}, ${companion.tone || 'warm'} vibe, ${companion.voiceStyle || 'soft'} presence`;
      const res = await fetch('/api/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          companionId: companionId && companionId !== 'local' ? companionId : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Image failed');
      setHistory((h) => [
        ...h,
        {
          role: 'assistant',
          content: 'Sent you a photo ✨',
          modality: 'image',
          mediaUrl: data.url,
        },
      ]);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Image failed');
    } finally {
      setLoading(false);
    }
  }

  if (!companion) {
    return (
      <main className="container">
        <div className="card">
          <p>No companion yet. <a href="/create">Create one</a>.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="container" style={{ maxWidth: 720 }}>
      <div className="card">
        <div className="row" style={{ justifyContent: 'space-between', marginBottom: 8 }}>
          <div>
            <h2 style={{ margin: 0 }}>Chatting with {companion.name}</h2>
            <p className="muted" style={{ margin: '4px 0 0', fontSize: '0.9rem' }}>
              {companionId && companionId !== 'local'
                ? 'Synced to your account · memory on'
                : 'Local draft · sign in to persist memory'}
            </p>
          </div>
        </div>

        <div className="chat-log" ref={logRef}>
          {history.map((m, i) => (
            <div key={i} className={m.role === 'user' ? 'bubble-user' : 'bubble-ai'}>
              <div style={{ fontSize: '0.75rem', opacity: 0.7, marginBottom: 4 }}>
                {m.role === 'user' ? 'You' : companion.name}
                {m.modality === 'voice' ? ' · voice' : ''}
                {m.modality === 'image' ? ' · photo' : ''}
              </div>
              {m.content}
              {m.mediaUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={m.mediaUrl}
                  alt="Companion photo"
                  style={{ display: 'block', maxWidth: '100%', borderRadius: 12, marginTop: 8 }}
                />
              )}
              {m.role === 'assistant' && m.modality !== 'image' && (
                <div style={{ marginTop: 6 }}>
                  <button
                    type="button"
                    className="ghost"
                    style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                    onClick={() => speak(m.content)}
                  >
                    Speak
                  </button>
                </div>
              )}
            </div>
          ))}
          {loading && <div className="muted">…</div>}
        </div>

        {error && <p className="error">{error}</p>}

        <div className="row">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && send()}
            placeholder="Say something…"
            disabled={loading}
          />
          <button type="button" onClick={() => send()} disabled={loading || !input.trim()}>
            Send
          </button>
        </div>

        <div className="row" style={{ marginTop: 10, flexWrap: 'wrap' }}>
          {!recording ? (
            <button type="button" className="secondary" onClick={startRecording} disabled={loading}>
              Mic
            </button>
          ) : (
            <button type="button" onClick={stopRecording}>
              Stop & send voice
            </button>
          )}
          {imageEnabled && (
            <button type="button" className="secondary" onClick={requestPhoto} disabled={loading}>
              Self-photo
            </button>
          )}
        </div>
      </div>
    </main>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={<main className="container">Loading chat…</main>}>
      <ChatInner />
    </Suspense>
  );
}
